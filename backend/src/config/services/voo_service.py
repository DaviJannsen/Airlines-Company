"""
Airlines Company — Service de Voos
───────────────────────────────────
Responsabilidade: toda a lógica de negócio referente a Voos.
Usa Raw SQL para queries complexas que refletem exatamente
o modelo relacional definido no TP2.
"""
from django.db import connection


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
                -- Aeroporto de Origem
                t.codigo_IATA_origem                AS iata_origem,
                a_orig.nome_aeroporto               AS aeroporto_origem,
                c_orig.nome_cidade                  AS cidade_origem,
                c_orig.pais                         AS pais_origem,
                -- Aeroporto de Destino
                t.codigo_IATA_destino               AS iata_destino,
                a_dest.nome_aeroporto               AS aeroporto_destino,
                c_dest.nome_cidade                  AS cidade_destino,
                c_dest.pais                         AS pais_destino,
                -- Trecho
                t.distancia_km,
                t.tipo_trecho
            FROM airline.voo v
            INNER JOIN airline.trecho t        ON t.num_voo = v.num_voo
            INNER JOIN airline.aeroporto a_orig ON a_orig.codigo_IATA = t.codigo_IATA_origem
            INNER JOIN airline.cidade c_orig    ON c_orig.id_cidade = a_orig.id_cidade
            INNER JOIN airline.aeroporto a_dest ON a_dest.codigo_IATA = t.codigo_IATA_destino
            INNER JOIN airline.cidade c_dest    ON c_dest.id_cidade = a_dest.id_cidade
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

        sql += " ORDER BY v.data_partida ASC, v.hora_partida ASC;"

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
    def criar_voo(dados: dict) -> dict:
        """Insere um novo voo validando restrições de aeronave."""
        # ─── CORRIGIDO: Adicionado airline. nas validações e inserts ──────────
        sql_check_aeronave = """
            SELECT cod_aeronave FROM airline.aeronave
            WHERE cod_aeronave = %s LIMIT 1;
        """
        sql_check_conflito = """
            SELECT num_voo FROM airline.voo
            WHERE cod_aeronave = %s
              AND data_partida = %s
              AND status_voo NOT IN ('cancelado', 'concluido')
            LIMIT 1;
        """
        sql_insert = """
            INSERT INTO airline.voo (
                num_voo, tipo_voo, data_partida, hora_partida,
                previsao_chegada, status_voo, cod_aeronave
            ) VALUES (%s, %s, %s, %s, %s, %s, %s)
            RETURNING num_voo;
        """

        with connection.cursor() as cursor:
            cursor.execute(sql_check_aeronave, [dados["cod_aeronave"]])
            if not cursor.fetchone():
                return {"error": f"Aeronave '{dados['cod_aeronave']}' não encontrada."}

            cursor.execute(sql_check_conflito, [dados["cod_aeronave"], dados["data_partida"]])
            conflito = cursor.fetchone()
            if conflito:
                return {
                    "error": (
                        f"Aeronave '{dados['cod_aeronave']}' já está alocada no "
                        f"voo '{conflito[0]}' nesta data."
                    )
                }

            cursor.execute(
                sql_insert,
                [
                    dados["num_voo"],
                    dados["tipo_voo"],
                    dados["data_partida"],
                    dados["hora_partida"],
                    dados["previsao_chegada"],
                    dados.get("status_voo", "programado"),
                    dados["cod_aeronave"],
                ],
            )
            num_voo_criado = cursor.fetchone()[0]

        return {"message": "Voo criado com sucesso.", "num_voo": num_voo_criado}