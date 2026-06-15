# reset.py — Limpa os dados operacionais preservando cidades e aeroportos
import os
import subprocess
import psycopg
from decouple import config

# Tabelas operacionais a limpar, excluindo cidade e aeroporto (referência estática)
TRUNCATE_SQL = """
TRUNCATE TABLE
    airline.controle_embarque,
    airline.destinado_a,
    airline.passagem,
    airline.reserva,
    airline.escala_trabalho,
    airline.funcionario_idioma,
    airline.piloto,
    airline.comissario,
    airline.comissao_de_bordo,
    airline.idioma,
    airline.trecho,
    airline.voo,
    airline.aeronave,
    airline.modelo_aeronave,
    airline.passageiro
RESTART IDENTITY CASCADE
"""


def executar_sql(cursor, sql: str):
    statements = [s.strip() for s in sql.split(';') if s.strip()]
    for stmt in statements:
        cursor.execute(stmt)


def schema_existe(conn) -> bool:
    with conn.cursor() as cursor:
        cursor.execute(
            "SELECT 1 FROM information_schema.schemata WHERE schema_name = 'airline';"
        )
        return cursor.fetchone() is not None


def deletar_admin() -> int:
    result = subprocess.run(
        [
            'python', 'manage.py', 'shell', '-c',
            'from django.contrib.auth.models import User; '
            'count, _ = User.objects.filter(is_superuser=True).delete(); '
            'print(count)',
        ],
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        raise RuntimeError(result.stderr.strip())
    return int(result.stdout.strip() or '0')


def main():
    database_url = config("DATABASE_URL", default=None)
    if not database_url:
        print("ERRO: DATABASE_URL não encontrada no .env")
        return

    print("\n⚠️  AVISO: Esta ação vai APAGAR todos os dados operacionais do sistema")
    print("   (voos, aeronaves, passageiros, tripulação, reservas, etc.)")
    print("   Cidades e aeroportos serão preservados.")
    print("   O login de administrador será removido.\n")
    confirmacao = input("   Digite 'sim' para confirmar: ").strip().lower()
    if confirmacao != "sim":
        print("\nOperação cancelada.")
        return

    print("\nConectando ao banco de dados...")
    try:
        with psycopg.connect(database_url) as conn:
            if schema_existe(conn):
                print("Schema 'airline' encontrado — limpando dados operacionais...")
                with conn.cursor() as cursor:
                    cursor.execute(TRUNCATE_SQL)
                conn.commit()
                print("  Dados operacionais removidos. Cidades e aeroportos preservados.")
            else:
                # Primeira execução — schema não existe ainda
                path_create = os.path.join("database", "01_create.sql")
                if not os.path.exists(path_create):
                    print(f"ERRO: Arquivo não encontrado: {path_create}")
                    return
                print("Schema 'airline' não encontrado — criando estrutura do zero...")
                with conn.cursor() as cursor:
                    with open(path_create, "r", encoding="utf-8") as f:
                        executar_sql(cursor, f.read())
                conn.commit()
                print("  Schema criado com sucesso.")

        print("\nRemovendo login de administrador...")
        deletados = deletar_admin()
        if deletados:
            print(f"  {deletados} administrador(es) removido(s).")
        else:
            print("  Nenhum administrador encontrado.")

        print("\nReset concluído!")
        print("\nPróximos passos:")
        print("  1. python populate.py          → repopular dados")
        print("  2. http://localhost:5173/admin/setup  → criar novo administrador\n")

    except Exception as e:
        print(f"\nERRO durante o reset: {e}\n")


if __name__ == "__main__":
    main()
