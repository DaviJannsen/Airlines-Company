"""
Airlines Company — Service de Passageiros
──────────────────────────────────────────
Regras de negócio e queries relacionadas a Passageiros,
Reservas, Passagens e Controle de Embarque.
"""
import random
import string
from django.db import connection, transaction as db_transaction


def _dictfetchall(cursor) -> list[dict]:
    columns = [col[0] for col in cursor.description]
    return [dict(zip(columns, row)) for row in cursor.fetchall()]


class PassageiroService:

    @staticmethod
    def listar_reservas_passageiro(id_passageiro: int) -> list[dict]:
        """
        Lista todas as reservas de um passageiro com detalhes de voo.

        JOIN em cascata: Passagem → Reserva → Destinado_A → Voo → Trecho
        para trazer todos os dados relevantes ao painel do passageiro.
        """
        sql = """
    SELECT
        r.codigo_localizador,
        r.data_criacao,
        r.status_pagamento,
        r.valor_total,
        r.agencia_parceira,
        -- Passagem
        pa.id_passagem,
        pa.classe_cabine,
        pa.assento_passageiro,
        pa.bagagem_despachada,
        pa.peso_bagagem,
        -- Voo via Destinado_A
        v.num_voo,
        v.tipo_voo,
        v.data_partida,
        v.hora_partida,
        v.previsao_chegada,
        v.status_voo,
        -- Trecho (origem → destino)
        c_orig.nome_cidade  AS cidade_origem,
        c_dest.nome_cidade  AS cidade_destino,
        -- Status de embarque
        ce.status_presenca_passageiro
    FROM airline.passagem pa
    INNER JOIN airline.reserva r           ON r.codigo_localizador = pa.codigo_localizador
    INNER JOIN airline.destinado_a da     ON da.id_passagem = pa.id_passagem
    INNER JOIN airline.voo v               ON v.num_voo = da.num_voo
    INNER JOIN airline.trecho t           ON t.num_voo = v.num_voo
    INNER JOIN airline.aeroporto a_orig   ON a_orig.codigo_IATA = t.codigo_IATA_origem
    INNER JOIN airline.cidade c_orig      ON c_orig.id_cidade = a_orig.id_cidade
    INNER JOIN airline.aeroporto a_dest   ON a_dest.codigo_IATA = t.codigo_IATA_destino
    INNER JOIN airline.cidade c_dest      ON c_dest.id_cidade = a_dest.id_cidade
    LEFT JOIN airline.controle_embarque ce ON ce.id_passagem = pa.id_passagem
                                          AND ce.num_voo = v.num_voo
    WHERE pa.id_passageiro = %s
    ORDER BY v.data_partida DESC, v.hora_partida DESC;
"""
        with connection.cursor() as cursor:
            cursor.execute(sql, [id_passageiro])
            return _dictfetchall(cursor)

    @staticmethod
    def listar_passageiros(busca: str = "") -> list[dict]:
        """
        Lista todos os passageiros. Suporta busca por nome ou documento.
        Uso exclusivo do painel ADM.
        """
        sql = """
            SELECT
                p.id_passageiro,
                p.nome_completo,
                p.data_nascimento,
                p.documento_identidade,
                p.necessidades_especiais,
                p.contato_emergencia,
                COUNT(pa.id_passagem) AS total_passagens
            FROM airline.passageiro p
            LEFT JOIN airline.passagem pa ON pa.id_passageiro = p.id_passageiro
            WHERE 1=1
        """
        params = []

        if busca:
            sql += " AND (p.nome_completo ILIKE %s OR p.documento_identidade ILIKE %s)"
            params.extend([f"%{busca}%", f"%{busca}%"])

        sql += " GROUP BY p.id_passageiro, p.nome_completo, p.data_nascimento, p.documento_identidade, p.necessidades_especiais, p.contato_emergencia ORDER BY p.nome_completo ASC;"

        with connection.cursor() as cursor:
            cursor.execute(sql, params)
            return _dictfetchall(cursor)

    @staticmethod
    def buscar_passageiro_por_documento(documento: str) -> dict | None:
        """Busca um passageiro pelo documento de identidade."""
        sql = """
            SELECT id_passageiro, nome_completo, data_nascimento,
                   documento_identidade, necessidades_especiais, contato_emergencia
            FROM passageiro
            WHERE documento_identidade = %s
            LIMIT 1;
        """
        with connection.cursor() as cursor:
            cursor.execute(sql, [documento])
            columns = [col[0] for col in cursor.description]
            row = cursor.fetchone()
            return dict(zip(columns, row)) if row else None

    @staticmethod
    def cadastrar_passageiro(dados: dict) -> dict:
        """Cria um novo passageiro na tabela airline.passageiro."""
        campos = ["nome_completo", "data_nascimento", "nacionalidade", "documento_identidade"]
        ausentes = [c for c in campos if not dados.get(c)]
        if ausentes:
            return {"error": f"Campos obrigatórios: {', '.join(ausentes)}"}

        documento = dados["documento_identidade"]
        if not any(documento.startswith(p) for p in ("CPF-", "PASSPORT-", "DNI-")):
            return {"error": "Documento deve iniciar com CPF-, PASSPORT- ou DNI-."}

        with connection.cursor() as cursor:
            cursor.execute(
                "SELECT id_passageiro FROM airline.passageiro WHERE documento_identidade = %s LIMIT 1;",
                [documento],
            )
            if cursor.fetchone():
                return {"error": "Já existe um cadastro com este documento de identidade."}

            cursor.execute(
                """
                INSERT INTO airline.passageiro (
                    nome_completo, data_nascimento, nacionalidade,
                    documento_identidade, contato_emergencia, necessidades_especiais
                ) VALUES (%s, %s, %s, %s, %s, FALSE)
                RETURNING id_passageiro;
                """,
                [
                    dados["nome_completo"],
                    dados["data_nascimento"],
                    dados["nacionalidade"],
                    documento,
                    dados.get("contato_emergencia") or None,
                ],
            )
            id_passageiro = cursor.fetchone()[0]

        return {
            "message": "Cadastro realizado com sucesso!",
            "id_passageiro": id_passageiro,
            "documento_identidade": documento,
            "nome_completo": dados["nome_completo"],
        }

    @staticmethod
    def solicitar_passagem(id_passageiro: int, dados: dict) -> dict:
        """
        Cria em transação atômica: Reserva → Passagem → Destinado_A → Controle_Embarque.
        """
        num_voo = dados.get("num_voo")
        classe_cabine = dados.get("classe_cabine", "Econômica")

        if not num_voo:
            return {"error": "O campo 'num_voo' é obrigatório."}
        if classe_cabine not in ("Econômica", "Executiva", "Primeira Classe"):
            return {"error": "Classe de cabine inválida."}

        PRECOS = {"Econômica": 850.00, "Executiva": 2500.00, "Primeira Classe": 8000.00}

        with db_transaction.atomic():
            with connection.cursor() as cursor:
                cursor.execute(
                    """
                    SELECT v.status_voo, ma.capacidade,
                           COUNT(DISTINCT da.id_passagem) AS emitidas
                    FROM airline.voo v
                    INNER JOIN airline.aeronave aer ON aer.cod_aeronave = v.cod_aeronave
                    INNER JOIN airline.modelo_aeronave ma ON ma.modelo = aer.modelo
                    LEFT  JOIN airline.destinado_a da ON da.num_voo = v.num_voo
                    WHERE v.num_voo = %s
                    GROUP BY v.status_voo, ma.capacidade
                    LIMIT 1;
                    """,
                    [num_voo],
                )
                row = cursor.fetchone()
                if not row:
                    return {"error": f"Voo '{num_voo}' não encontrado."}

                status_voo, capacidade, emitidas = row
                if status_voo in ("Cancelado", "Concluído"):
                    return {"error": f"Voo com status '{status_voo}' não aceita reservas."}
                if emitidas >= capacidade:
                    return {"error": "Voo lotado. Não há assentos disponíveis."}

                cursor.execute(
                    """
                    SELECT p.assento_passageiro
                    FROM airline.passagem p
                    INNER JOIN airline.destinado_a da ON da.id_passagem = p.id_passagem
                    WHERE da.num_voo = %s;
                    """,
                    [num_voo],
                )
                ocupados = {r[0] for r in cursor.fetchall()}

                assento = None
                for linha in range(1, 100):
                    for letra in ("A", "B", "C", "D", "E", "F"):
                        candidato = f"{linha}{letra}"
                        if candidato not in ocupados:
                            assento = candidato
                            break
                    if assento:
                        break

                if not assento:
                    return {"error": "Não foi possível alocar um assento."}

                localizador = "RES-" + "".join(
                    random.choices(string.ascii_uppercase + string.digits, k=8)
                )

                cursor.execute(
                    """
                    INSERT INTO airline.reserva (codigo_localizador, data_criacao, status_pagamento, valor_total)
                    VALUES (%s, CURRENT_DATE, 'Pendente', %s);
                    """,
                    [localizador, PRECOS[classe_cabine]],
                )

                cursor.execute(
                    """
                    INSERT INTO airline.passagem (
                        classe_cabine, assento_passageiro, id_passageiro,
                        codigo_localizador, bagagem_despachada
                    ) VALUES (%s, %s, %s, %s, FALSE)
                    RETURNING id_passagem;
                    """,
                    [classe_cabine, assento, id_passageiro, localizador],
                )
                id_passagem = cursor.fetchone()[0]

                cursor.execute(
                    "INSERT INTO airline.destinado_a (id_passagem, num_voo) VALUES (%s, %s);",
                    [id_passagem, num_voo],
                )

                cursor.execute(
                    """
                    INSERT INTO airline.controle_embarque (
                        data_hora_passagem_gate, status_presenca_passageiro,
                        status_autorizacao, num_voo, id_passagem
                    ) VALUES (NOW(), 'Ausente', 'Pendente', %s, %s)
                    RETURNING id_controle_embarque;
                    """,
                    [num_voo, id_passagem],
                )
                id_controle = cursor.fetchone()[0]

        return {
            "message": "Passagem reservada com sucesso!",
            "codigo_localizador": localizador,
            "assento": assento,
            "classe_cabine": classe_cabine,
            "num_voo": num_voo,
            "valor_total": PRECOS[classe_cabine],
            "id_controle_embarque": id_controle,
        }

    @staticmethod
    def listar_embarque(filtro_voo: str = None) -> list[dict]:
        """Lista registros de controle_embarque para o painel do admin."""
        sql = """
            SELECT
                ce.id_controle_embarque,
                ce.data_hora_passagem_gate,
                ce.status_presenca_passageiro,
                ce.status_autorizacao,
                ce.motivo_impedimento_embarque,
                ce.num_voo,
                ce.id_passagem,
                pa.nome_completo       AS nome_passageiro,
                pa.documento_identidade,
                p.classe_cabine,
                p.assento_passageiro,
                v.data_partida,
                v.hora_partida,
                c_orig.nome_cidade     AS cidade_origem,
                c_dest.nome_cidade     AS cidade_destino
            FROM airline.controle_embarque ce
            INNER JOIN airline.passagem p    ON p.id_passagem = ce.id_passagem
            INNER JOIN airline.passageiro pa ON pa.id_passageiro = p.id_passageiro
            INNER JOIN airline.voo v         ON v.num_voo = ce.num_voo
            INNER JOIN LATERAL (
                SELECT codigo_IATA_origem, codigo_IATA_destino
                FROM airline.trecho
                WHERE num_voo = v.num_voo
                ORDER BY codigo_trecho
                LIMIT 1
            ) t ON TRUE
            INNER JOIN airline.aeroporto ao  ON ao.codigo_IATA = t.codigo_IATA_origem
            INNER JOIN airline.cidade c_orig ON c_orig.id_cidade = ao.id_cidade
            INNER JOIN airline.aeroporto ad  ON ad.codigo_IATA = t.codigo_IATA_destino
            INNER JOIN airline.cidade c_dest ON c_dest.id_cidade = ad.id_cidade
            WHERE 1=1
        """
        params = []
        if filtro_voo:
            sql += " AND ce.num_voo = %s"
            params.append(filtro_voo)

        sql += """
            ORDER BY
                CASE ce.status_autorizacao WHEN 'Pendente' THEN 0 WHEN 'Autorizado' THEN 1 ELSE 2 END,
                v.data_partida ASC, v.hora_partida ASC;
        """
        with connection.cursor() as cursor:
            cursor.execute(sql, params)
            return _dictfetchall(cursor)

    @staticmethod
    def autorizar_embarque(id_controle: int) -> dict:
        """Autoriza o embarque: marca presença e aprova autorização."""
        with connection.cursor() as cursor:
            cursor.execute(
                """
                UPDATE airline.controle_embarque
                SET status_autorizacao = 'Autorizado',
                    status_presenca_passageiro = 'Presente'
                WHERE id_controle_embarque = %s
                RETURNING id_controle_embarque;
                """,
                [id_controle],
            )
            if not cursor.fetchone():
                return {"error": "Registro de embarque não encontrado."}
        return {"message": "Embarque autorizado.", "id_controle_embarque": id_controle}

    @staticmethod
    def negar_embarque(id_controle: int, motivo: str) -> dict:
        """Nega o embarque registrando o motivo do impedimento."""
        with connection.cursor() as cursor:
            cursor.execute(
                """
                UPDATE airline.controle_embarque
                SET status_autorizacao = 'Negado',
                    motivo_impedimento_embarque = %s
                WHERE id_controle_embarque = %s
                RETURNING id_controle_embarque;
                """,
                [motivo, id_controle],
            )
            if not cursor.fetchone():
                return {"error": "Registro de embarque não encontrado."}
        return {"message": "Embarque negado.", "id_controle_embarque": id_controle}