"""
Airlines Company — Service de Funcionários (Comissão de Bordo)
──────────────────────────────────────────────────────────────
Gerencia pilotos, comissários e escala de trabalho.
"""
import re
from django.db import connection, transaction as db_transaction


def _dictfetchall(cursor) -> list[dict]:
    columns = [col[0] for col in cursor.description]
    return [dict(zip(columns, row)) for row in cursor.fetchall()]


class FuncionarioService:

    @staticmethod
    def listar_comissao(num_voo: str = None) -> list[dict]:
        """
        Lista todos os membros da comissão de bordo.
        Se num_voo for fornecido, inclui flag 'escalado_neste_voo'.
        """
        if num_voo:
            sql = """
                SELECT
                    c.id_funcionario,
                    c.nome_completo,
                    c.cpf,
                    c.salario_base,
                    CASE
                        WHEN p.id_funcionario IS NOT NULL THEN 'Piloto'
                        ELSE 'Comissário'
                    END AS cargo,
                    p.licenca_piloto,
                    CASE
                        WHEN p.id_funcionario IS NOT NULL THEN p.validade_habilitacao::TEXT
                        ELSE com.validade_certificado::TEXT
                    END AS validade_certificado,
                    CASE WHEN et.id_funcionario IS NOT NULL THEN TRUE ELSE FALSE END AS escalado_neste_voo
                FROM airline.comissao_de_bordo c
                LEFT JOIN airline.piloto p       ON p.id_funcionario = c.id_funcionario
                LEFT JOIN airline.comissario com  ON com.id_funcionario = c.id_funcionario
                LEFT JOIN airline.escala_trabalho et
                    ON et.id_funcionario = c.id_funcionario AND et.num_voo = %s
                ORDER BY
                    CASE WHEN p.id_funcionario IS NOT NULL THEN 0 ELSE 1 END,
                    c.nome_completo ASC;
            """
            params = [num_voo]
        else:
            sql = """
                SELECT
                    c.id_funcionario,
                    c.nome_completo,
                    c.cpf,
                    c.data_admissao,
                    c.salario_base,
                    CASE
                        WHEN p.id_funcionario IS NOT NULL THEN 'Piloto'
                        ELSE 'Comissário'
                    END AS cargo,
                    p.licenca_piloto,
                    CASE
                        WHEN p.id_funcionario IS NOT NULL THEN p.validade_habilitacao::TEXT
                        ELSE com.validade_certificado::TEXT
                    END AS validade_certificado,
                    (
                        SELECT COUNT(*) FROM airline.escala_trabalho et
                        WHERE et.id_funcionario = c.id_funcionario
                    ) AS total_voos
                FROM airline.comissao_de_bordo c
                LEFT JOIN airline.piloto p       ON p.id_funcionario = c.id_funcionario
                LEFT JOIN airline.comissario com  ON com.id_funcionario = c.id_funcionario
                ORDER BY
                    CASE WHEN p.id_funcionario IS NOT NULL THEN 0 ELSE 1 END,
                    c.nome_completo ASC;
            """
            params = []

        with connection.cursor() as cursor:
            cursor.execute(sql, params)
            return _dictfetchall(cursor)

    @staticmethod
    def listar_passageiros_do_voo(num_voo: str) -> list[dict]:
        """Lista todos os passageiros confirmados em um voo via Destinado_A."""
        sql = """
            SELECT
                pa.id_passageiro,
                pa.nome_completo,
                pa.documento_identidade,
                p.id_passagem,
                p.assento_passageiro,
                p.classe_cabine,
                p.bagagem_despachada,
                r.codigo_localizador,
                r.status_pagamento,
                r.valor_total,
                ce.status_autorizacao,
                ce.status_presenca_passageiro
            FROM airline.destinado_a da
            INNER JOIN airline.passagem p    ON p.id_passagem = da.id_passagem
            INNER JOIN airline.passageiro pa ON pa.id_passageiro = p.id_passageiro
            INNER JOIN airline.reserva r     ON r.codigo_localizador = p.codigo_localizador
            LEFT  JOIN airline.controle_embarque ce
                ON ce.id_passagem = p.id_passagem AND ce.num_voo = da.num_voo
            WHERE da.num_voo = %s
            ORDER BY p.assento_passageiro ASC;
        """
        with connection.cursor() as cursor:
            cursor.execute(sql, [num_voo])
            return _dictfetchall(cursor)

    @staticmethod
    def escalar_funcionario(id_funcionario: int, num_voo: str) -> dict:
        """Insere um vínculo em airline.escala_trabalho."""
        with connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT codigo_IATA_origem FROM airline.trecho
                WHERE num_voo = %s ORDER BY codigo_trecho LIMIT 1;
                """,
                [num_voo],
            )
            row = cursor.fetchone()
            if not row:
                return {"error": f"Voo '{num_voo}' não possui trecho cadastrado."}
            codigo_iata = row[0]

            cursor.execute(
                "SELECT 1 FROM airline.escala_trabalho WHERE id_funcionario = %s AND num_voo = %s LIMIT 1;",
                [id_funcionario, num_voo],
            )
            if cursor.fetchone():
                return {"error": "Funcionário já está escalado para este voo."}

            cursor.execute(
                """
                INSERT INTO airline.escala_trabalho (id_funcionario, num_voo, codigo_IATA)
                VALUES (%s, %s, %s);
                """,
                [id_funcionario, num_voo, codigo_iata],
            )

        return {
            "message": "Funcionário escalado com sucesso.",
            "id_funcionario": id_funcionario,
            "num_voo": num_voo,
        }

    @staticmethod
    def desescalar_funcionario(id_funcionario: int, num_voo: str) -> dict:
        """Remove um vínculo de airline.escala_trabalho."""
        with connection.cursor() as cursor:
            cursor.execute(
                """
                DELETE FROM airline.escala_trabalho
                WHERE id_funcionario = %s AND num_voo = %s
                RETURNING id_funcionario;
                """,
                [id_funcionario, num_voo],
            )
            if not cursor.fetchone():
                return {"error": "Escalação não encontrada."}

        return {
            "message": "Funcionário removido da escala.",
            "id_funcionario": id_funcionario,
            "num_voo": num_voo,
        }

    @staticmethod
    def criar_funcionario(dados: dict) -> dict:
        """
        Cria um Piloto ou Comissário.
        Insere em comissao_de_bordo (tabela base) e depois na subclasse correspondente,
        tudo numa transação atômica.
        """
        cargo         = dados.get('cargo', '').strip()
        nome_completo = dados.get('nome_completo', '').strip()
        cpf           = re.sub(r'\D', '', dados.get('cpf', ''))
        data_admissao = dados.get('data_admissao', '').strip()
        salario_base  = dados.get('salario_base')

        if cargo not in ('Piloto', 'Comissário'):
            return {'error': "Cargo deve ser 'Piloto' ou 'Comissário'."}
        if not all([nome_completo, cpf, data_admissao, salario_base]):
            return {'error': 'Nome, CPF, data de admissão e salário são obrigatórios.'}
        if not re.match(r'^\d{11}$', cpf):
            return {'error': 'CPF deve conter exatamente 11 dígitos numéricos.'}

        try:
            salario_base = float(salario_base)
            if salario_base <= 0:
                return {'error': 'Salário deve ser maior que zero.'}
        except (ValueError, TypeError):
            return {'error': 'Salário inválido.'}

        if cargo == 'Piloto':
            licenca      = dados.get('licenca_piloto', '').strip()
            validade_hab = dados.get('validade_habilitacao', '').strip()
            if not licenca or not validade_hab:
                return {'error': 'Licença e validade de habilitação são obrigatórias para Piloto.'}
        else:
            validade_cert = dados.get('validade_certificado', '').strip()
            if not validade_cert:
                return {'error': 'Validade do certificado é obrigatória para Comissário.'}

        with db_transaction.atomic():
            with connection.cursor() as cursor:
                cursor.execute(
                    "SELECT 1 FROM airline.comissao_de_bordo WHERE cpf = %s LIMIT 1;", [cpf]
                )
                if cursor.fetchone():
                    return {'error': f"CPF '{cpf}' já está cadastrado."}

                cursor.execute(
                    """
                    INSERT INTO airline.comissao_de_bordo
                        (cpf, nome_completo, data_admissao, salario_base)
                    VALUES (%s, %s, %s, %s)
                    RETURNING id_funcionario;
                    """,
                    [cpf, nome_completo, data_admissao, salario_base],
                )
                id_func = cursor.fetchone()[0]

                if cargo == 'Piloto':
                    cursor.execute(
                        """
                        INSERT INTO airline.piloto
                            (id_funcionario, licenca_piloto, validade_habilitacao)
                        VALUES (%s, %s, %s);
                        """,
                        [id_func, licenca, validade_hab],
                    )
                else:
                    cursor.execute(
                        """
                        INSERT INTO airline.comissario
                            (id_funcionario, validade_certificado)
                        VALUES (%s, %s);
                        """,
                        [id_func, validade_cert],
                    )

        return {
            'id_funcionario': id_func,
            'nome_completo': nome_completo,
            'cargo': cargo,
            'message': f'{cargo} cadastrado com sucesso.',
        }
