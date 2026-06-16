"""
Airlines Company — Service de Voos
───────────────────────────────────
Responsabilidade: toda a lógica de negócio referente a Voos.
Usa Raw SQL para queries complexas que refletem exatamente
o modelo relacional definido no TP2.
"""
from django.db import connection, transaction as db_transaction


def _dictfetchall(cursor) -> list[dict]:
    """Converte resultado de cursor em lista de dicionários."""
    columns = [col[0] for col in cursor.description]
    return [dict(zip(columns, row)) for row in cursor.fetchall()]


def _dictfetchone(cursor) -> dict | None:
    """Converte primeira linha de cursor em dicionário."""
    columns = [col[0] for col in cursor.description]
    row = cursor.fetchone()
    return dict(zip(columns, row)) if row else None


class VooService:

    @staticmethod
    def listar_voos(filtros: dict) -> list[dict]:
        """
        Lista voos com filtros opcionais de origem, destino, data e tipo.
        """
        # ─── CORRIGIDO: Adicionado airline. antes de cada tabela ──────────────
        sql = """
            SELECT
                v.num_voo,
                v.tipo_voo,
                v.data_partida,
                v.hora_partida,
                v.previsao_chegada,
                v.status_voo,
                v.cod_aeronave,
                t.codigo_IATA_origem                AS iata_origem,
                a_orig.nome_aeroporto               AS aeroporto_origem,
                c_orig.nome_cidade                  AS cidade_origem,
                c_orig.pais                         AS pais_origem,
                t.codigo_IATA_destino               AS iata_destino,
                a_dest.nome_aeroporto               AS aeroporto_destino,
                c_dest.nome_cidade                  AS cidade_destino,
                c_dest.pais                         AS pais_destino,
                t.distancia_km,
                t.tipo_trecho,
                ma.capacidade                       AS capacidade_total,
                COUNT(DISTINCT da.id_passagem)      AS passagens_emitidas,
                (ma.capacidade - COUNT(DISTINCT da.id_passagem)) AS assentos_restantes,
                v.data_hora_efetiva_cancelamento::TEXT         AS data_hora_cancelamento,
                (
                    SELECT COUNT(DISTINCT da2.id_passagem)
                    FROM airline.destinado_a da2
                    LEFT JOIN airline.controle_embarque ce2
                        ON ce2.id_passagem = da2.id_passagem AND ce2.num_voo = da2.num_voo
                    WHERE da2.num_voo = v.num_voo
                      AND (ce2.status_autorizacao IS DISTINCT FROM 'Negado')
                ) AS passagens_embarcadas
            FROM airline.voo v
            INNER JOIN airline.trecho t          ON t.num_voo = v.num_voo
            INNER JOIN airline.aeroporto a_orig  ON a_orig.codigo_IATA = t.codigo_IATA_origem
            INNER JOIN airline.cidade c_orig     ON c_orig.id_cidade = a_orig.id_cidade
            INNER JOIN airline.aeroporto a_dest  ON a_dest.codigo_IATA = t.codigo_IATA_destino
            INNER JOIN airline.cidade c_dest     ON c_dest.id_cidade = a_dest.id_cidade
            INNER JOIN airline.aeronave aer      ON aer.cod_aeronave = v.cod_aeronave
            INNER JOIN airline.modelo_aeronave ma ON ma.modelo = aer.modelo
            LEFT  JOIN airline.destinado_a da    ON da.num_voo = v.num_voo
            WHERE 1=1
        """
        params = []

        if filtros.get("origem"):
            sql += " AND t.codigo_IATA_origem = %s"
            params.append(filtros["origem"].upper())

        if filtros.get("destino"):
            sql += " AND t.codigo_IATA_destino = %s"
            params.append(filtros["destino"].upper())

        if filtros.get("data"):
            sql += " AND v.data_partida = %s"
            params.append(filtros["data"])

        if filtros.get("tipo_voo"):
            sql += " AND v.tipo_voo = %s"
            params.append(filtros["tipo_voo"])

        if filtros.get("busca"):
            sql += " AND v.num_voo ILIKE %s"
            params.append(f"%{filtros['busca']}%")

        sql += """
            GROUP BY
                v.num_voo, v.tipo_voo, v.data_partida, v.hora_partida, v.previsao_chegada,
                v.status_voo, v.cod_aeronave, v.data_hora_efetiva_cancelamento,
                t.codigo_IATA_origem, a_orig.nome_aeroporto, c_orig.nome_cidade, c_orig.pais,
                t.codigo_IATA_destino, a_dest.nome_aeroporto, c_dest.nome_cidade, c_dest.pais,
                t.distancia_km, t.tipo_trecho, ma.capacidade
            ORDER BY v.data_partida ASC, v.hora_partida ASC;
        """

        with connection.cursor() as cursor:
            cursor.execute(sql, params)
            return _dictfetchall(cursor)

    @staticmethod
    def buscar_voo_por_numero(num_voo: str) -> dict | None:
        """Retorna detalhes completos de um voo e seus trechos."""
        # ─── CORRIGIDO: Adicionado airline. antes das tabelas do voo ─────────
        sql_voo = """
            SELECT
                v.num_voo,
                v.tipo_voo,
                v.data_partida,
                v.hora_partida,
                v.previsao_chegada,
                v.status_voo,
                v.motivo_atraso_cancelamento,
                v.data_hora_efetiva_cancelamento::TEXT AS data_hora_cancelamento,
                -- Aeronave
                a.cod_aeronave,
                ma.modelo,
                ma.fabricante,
                ma.capacidade
            FROM airline.voo v
            INNER JOIN airline.aeronave a       ON a.cod_aeronave = v.cod_aeronave
            INNER JOIN airline.modelo_aeronave ma ON ma.modelo = a.modelo
            WHERE v.num_voo = %s
            LIMIT 1;
        """
        # ─── CORRIGIDO: Adicionado airline. antes das tabelas do trecho ──────
        sql_trechos = """
            SELECT
                t.codigo_trecho,
                t.tipo_trecho,
                t.distancia_km,
                t.codigo_IATA_origem,
                a_o.nome_aeroporto  AS aeroporto_origem,
                c_o.nome_cidade     AS cidade_origem,
                t.codigo_IATA_destino,
                a_d.nome_aeroporto  AS aeroporto_destino,
                c_d.nome_cidade     AS cidade_destino
            FROM airline.trecho t
            INNER JOIN airline.aeroporto a_o ON a_o.codigo_IATA = t.codigo_IATA_origem
            INNER JOIN airline.cidade c_o    ON c_o.id_cidade = a_o.id_cidade
            INNER JOIN airline.aeroporto a_d ON a_d.codigo_IATA = t.codigo_IATA_destino
            INNER JOIN airline.cidade c_d    ON c_d.id_cidade = a_d.id_cidade
            WHERE t.num_voo = %s
            ORDER BY t.codigo_trecho;
        """

        with connection.cursor() as cursor:
            cursor.execute(sql_voo, [num_voo])
            voo = _dictfetchone(cursor)

        if not voo:
            return None

        with connection.cursor() as cursor:
            cursor.execute(sql_trechos, [num_voo])
            trechos = _dictfetchall(cursor)

        voo["trechos"] = trechos
        return voo

    @staticmethod
    def atualizar_status_voo(num_voo: str, novo_status: str) -> dict:
        """
        Atualiza o status de um voo com validação de transições permitidas.
        Transições válidas:
          Programado → Em Voo | Atrasado | Cancelado
          Atrasado   → Em Voo | Cancelado
          Em Voo     → Concluído
        """
        TRANSICOES = {
            'Programado': {'Em Voo', 'Atrasado', 'Cancelado'},
            'Atrasado':   {'Em Voo', 'Cancelado'},
            'Em Voo':     {'Concluído'},
        }
        VALIDOS = {'Programado', 'Em Voo', 'Concluído', 'Cancelado', 'Atrasado'}

        if novo_status not in VALIDOS:
            return {"error": f"Status '{novo_status}' inválido."}

        with connection.cursor() as cursor:
            cursor.execute(
                "SELECT status_voo FROM airline.voo WHERE num_voo = %s LIMIT 1;", [num_voo]
            )
            row = cursor.fetchone()

        if not row:
            return {"error": f"Voo '{num_voo}' não encontrado."}

        status_atual = row[0]
        permitidos = TRANSICOES.get(status_atual, set())

        if novo_status not in permitidos:
            return {
                "error": (
                    f"Não é possível mover de '{status_atual}' para '{novo_status}'. "
                    f"Transições permitidas: {', '.join(sorted(permitidos)) or 'nenhuma'}."
                )
            }

        with connection.cursor() as cursor:
            cursor.execute(
                "UPDATE airline.voo SET status_voo = %s WHERE num_voo = %s;",
                [novo_status, num_voo],
            )

        return {"num_voo": num_voo, "status_anterior": status_atual, "status_voo": novo_status}

    @staticmethod
    def listar_aeronaves() -> list[dict]:
        """Lista todas as aeronaves disponíveis para o dropdown de criação de voo."""
        sql = """
            SELECT
                a.cod_aeronave,
                a.modelo,
                ma.fabricante,
                ma.capacidade,
                a.aviso_manutencao,
                a.data_ultima_manutencao::TEXT AS data_ultima_manutencao
            FROM airline.aeronave a
            INNER JOIN airline.modelo_aeronave ma ON ma.modelo = a.modelo
            ORDER BY a.cod_aeronave ASC;
        """
        with connection.cursor() as cursor:
            cursor.execute(sql)
            return _dictfetchall(cursor)

    @staticmethod
    def listar_modelos_aeronave() -> list[dict]:
        """Lista modelos disponíveis para o dropdown de criação de aeronave."""
        sql = """
            SELECT modelo, fabricante, capacidade, kms_rodados, preco::TEXT AS preco
            FROM airline.modelo_aeronave
            ORDER BY fabricante, modelo ASC;
        """
        with connection.cursor() as cursor:
            cursor.execute(sql)
            return _dictfetchall(cursor)

    @staticmethod
    def criar_aeronave(dados: dict) -> dict:
        """Insere uma nova aeronave validando código único e modelo existente."""
        cod = dados.get("cod_aeronave", "").strip().upper()
        modelo = dados.get("modelo", "").strip()
        data_manutencao = dados.get("data_ultima_manutencao") or None

        if not cod:
            return {"error": "O campo 'cod_aeronave' é obrigatório."}
        if not modelo:
            return {"error": "O campo 'modelo' é obrigatório."}

        with connection.cursor() as cursor:
            cursor.execute(
                "SELECT 1 FROM airline.aeronave WHERE cod_aeronave = %s LIMIT 1;", [cod]
            )
            if cursor.fetchone():
                return {"error": f"Já existe uma aeronave com o código '{cod}'."}

            cursor.execute(
                "SELECT 1 FROM airline.modelo_aeronave WHERE modelo = %s LIMIT 1;", [modelo]
            )
            if not cursor.fetchone():
                return {"error": f"Modelo '{modelo}' não encontrado."}

            cursor.execute(
                """
                INSERT INTO airline.aeronave (cod_aeronave, modelo, aviso_manutencao, data_ultima_manutencao)
                VALUES (%s, %s, FALSE, %s);
                """,
                [cod, modelo, data_manutencao],
            )

        return {"cod_aeronave": cod, "modelo": modelo, "message": "Aeronave criada com sucesso."}

    @staticmethod
    def criar_modelo_aeronave(dados: dict) -> dict:
        """Insere um novo modelo de aeronave validando unicidade do nome."""
        modelo    = dados.get('modelo', '').strip()
        fabricante = dados.get('fabricante', '').strip()
        capacidade = dados.get('capacidade')
        kms_rodados = dados.get('kms_rodados') or None
        preco       = dados.get('preco')       or None

        if not modelo:
            return {'error': "O campo 'modelo' é obrigatório."}
        if not fabricante:
            return {'error': "O campo 'fabricante' é obrigatório."}
        if not capacidade:
            return {'error': "O campo 'capacidade' é obrigatório."}

        try:
            capacidade = int(capacidade)
            if capacidade <= 0:
                return {'error': 'Capacidade deve ser maior que zero.'}
        except (ValueError, TypeError):
            return {'error': 'Capacidade inválida.'}

        if kms_rodados is not None:
            try:
                kms_rodados = int(kms_rodados)
            except (ValueError, TypeError):
                kms_rodados = None

        if preco is not None:
            try:
                preco = float(preco)
                if preco <= 0:
                    preco = None
            except (ValueError, TypeError):
                preco = None

        with connection.cursor() as cursor:
            cursor.execute(
                "SELECT 1 FROM airline.modelo_aeronave WHERE modelo = %s LIMIT 1;", [modelo]
            )
            if cursor.fetchone():
                return {'error': f"Modelo '{modelo}' já está cadastrado."}

            cursor.execute(
                """
                INSERT INTO airline.modelo_aeronave (modelo, fabricante, capacidade, kms_rodados, preco)
                VALUES (%s, %s, %s, %s, %s);
                """,
                [modelo, fabricante, capacidade, kms_rodados, preco],
            )

        return {
            'modelo': modelo,
            'fabricante': fabricante,
            'capacidade': capacidade,
            'message': 'Modelo criado com sucesso.',
        }

    @staticmethod
    def criar_voo(dados: dict) -> dict:
        """
        Insere um novo voo e, se iata_origem/iata_destino forem fornecidos,
        cria o trecho correspondente na mesma transação atômica.
        """
        num_voo = dados.get("num_voo", "").strip().upper()
        if len(num_voo) > 10:
            return {"error": f"Número do voo deve ter no máximo 10 caracteres (atual: {len(num_voo)})."}

        iata_orig = dados.get("iata_origem", "").upper()
        iata_dest = dados.get("iata_destino", "").upper()

        # Valida aeroportos ANTES de qualquer insert para não deixar voo sem trecho
        if iata_orig and iata_dest:
            with connection.cursor() as cursor:
                for iata in (iata_orig, iata_dest):
                    cursor.execute(
                        "SELECT 1 FROM airline.aeroporto WHERE codigo_IATA = %s LIMIT 1;", [iata]
                    )
                    if not cursor.fetchone():
                        return {
                            "error": (
                                f"Aeroporto '{iata}' não está cadastrado no banco. "
                                "Execute python populate.py para inserir os aeroportos."
                            )
                        }

        with db_transaction.atomic():
            with connection.cursor() as cursor:
                cursor.execute(
                    "SELECT cod_aeronave FROM airline.aeronave WHERE cod_aeronave = %s LIMIT 1;",
                    [dados["cod_aeronave"]],
                )
                if not cursor.fetchone():
                    return {"error": f"Aeronave '{dados['cod_aeronave']}' não encontrada."}

                cursor.execute(
                    """
                    SELECT num_voo FROM airline.voo
                    WHERE cod_aeronave = %s AND data_partida = %s
                      AND status_voo NOT IN ('Cancelado', 'Concluído')
                    LIMIT 1;
                    """,
                    [dados["cod_aeronave"], dados["data_partida"]],
                )
                conflito = cursor.fetchone()
                if conflito:
                    return {
                        "error": (
                            f"Aeronave '{dados['cod_aeronave']}' já está alocada no "
                            f"voo '{conflito[0]}' nesta data."
                        )
                    }

                cursor.execute(
                    """
                    INSERT INTO airline.voo (
                        num_voo, tipo_voo, data_partida, hora_partida,
                        previsao_chegada, status_voo, cod_aeronave
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s)
                    RETURNING num_voo;
                    """,
                    [
                        num_voo,
                        dados["tipo_voo"],
                        dados["data_partida"],
                        dados["hora_partida"],
                        dados["previsao_chegada"],
                        dados.get("status_voo", "Programado"),
                        dados["cod_aeronave"],
                    ],
                )
                num_voo_criado = cursor.fetchone()[0]

                if iata_orig and iata_dest:
                    cursor.execute(
                        """
                        INSERT INTO airline.trecho (
                            tipo_trecho, distancia_km, codigo_IATA_origem, codigo_IATA_destino,
                            num_voo, status_sazonalidade, via_aerea_regulamentada
                        ) VALUES (%s, 500, %s, %s, %s, 'Normal', TRUE);
                        """,
                        ["Direto", iata_orig, iata_dest, num_voo_criado],
                    )

        return {"message": "Voo criado com sucesso.", "num_voo": num_voo_criado}