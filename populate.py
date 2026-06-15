# populate.py — Popula o banco com os dados de exemplo (02_insert.sql)
# Cidade e Aeroporto usam ON CONFLICT DO NOTHING → idempotente por design.
import os
import psycopg
from decouple import config


def split_sql(sql: str) -> list[str]:
    return [s.strip() for s in sql.split(';') if s.strip()]


def verificar_admin(conn) -> bool | None:
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                "SELECT COUNT(*) FROM public.auth_user WHERE is_superuser = TRUE;"
            )
            return cursor.fetchone()[0] > 0
    except Exception:
        return None


def main():
    database_url = config("DATABASE_URL", default=None)
    if not database_url:
        print("ERRO: DATABASE_URL não encontrada no .env")
        return

    path_insert = os.path.join("database", "02_insert.sql")
    if not os.path.exists(path_insert):
        print(f"ERRO: Arquivo não encontrado: {path_insert}")
        return

    print("\nConectando ao banco de dados...")
    try:
        with psycopg.connect(database_url) as conn:
            with open(path_insert, "r", encoding="utf-8") as f:
                statements = split_sql(f.read())

            with conn.cursor() as cursor:
                print(f"Executando {path_insert}...")
                for stmt in statements:
                    cursor.execute(stmt)
            conn.commit()

            status_admin = verificar_admin(conn)

        print("\nBanco populado com sucesso!")
        print("Dados inseridos: cidades, aeroportos, modelos de aeronave,")
        print("aeronaves, voos, trechos, passageiros, funcionários e reservas.")

        print("\n─────────────────────────────────────────────────────────")
        if status_admin is None:
            print("AVISO: Tabelas do Django não encontradas.")
            print("  1. Execute:  python manage.py migrate")
            print("  2. Acesse:   http://localhost:5173/admin/setup")
        elif status_admin:
            print("Admin:  já cadastrado — pode fazer login normalmente.")
            print("  Acesse:  http://localhost:5173/admin/login")
        else:
            print("ATENÇÃO: Nenhum administrador cadastrado!")
            print("  Acesse agora:  http://localhost:5173/admin/setup")
        print("─────────────────────────────────────────────────────────\n")

    except Exception as e:
        print(f"\nERRO durante a população: {e}\n")


if __name__ == "__main__":
    main()
