"""
Airlines Company — Service de Passageiros
──────────────────────────────────────────
Regras de negócio e queries relacionadas a Passageiros,
Reservas, Passagens e Controle de Embarque.
"""
from django.db import connection


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
            FROM passageiro p
            LEFT JOIN passagem pa ON pa.id_passageiro = p.id_passageiro
            WHERE 1=1
        """
        params = []

        if busca:
            sql += " AND (p.nome_completo ILIKE %s OR p.documento_identidade ILIKE %s)"
            params.extend([f"%{busca}%", f"%{busca}%"])

        sql += " GROUP BY p.id_passageiro ORDER BY p.nome_completo ASC;"

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