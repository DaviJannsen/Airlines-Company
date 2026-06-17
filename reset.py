# reset.py — Limpa os dados operacionais preservando cidades, aeroportos e idiomas
import os
import re
import subprocess
import psycopg
from decouple import config

# Tabelas operacionais a limpar, excluindo cidade, aeroporto e idioma (dados de referência estáticos)
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
    airline.trecho,
    airline.voo,
    airline.aeronave,
    airline.modelo_aeronave,
    airline.passageiro
RESTART IDENTITY CASCADE
"""


def split_sql_simples(sql: str) -> list[str]:
    """Split básico por ';' — para arquivos sem dollar-quoting."""
    return [s.strip() for s in sql.split(';') if s.strip()]


def split_sql_dollar_safe(sql: str) -> list[str]:
    """Split por ';' ignorando comentários -- e blocos $$ ... $$ (funções PL/pgSQL)."""
    statements, current, in_dq, tag = [], [], False, ''
    i = 0; n = len(sql)
    while i < n:
        if in_dq:
            if sql[i:i + len(tag)] == tag:
                in_dq = False; current.append(tag); i += len(tag)
            else:
                current.append(sql[i]); i += 1
            continue
        # comentário de linha -- (ignora ; dentro)
        if sql[i:i + 2] == '--':
            while i < n and sql[i] != '\n':
                current.append(sql[i]); i += 1
            continue
        # início de dollar-quote
        m = re.match(r'\$[^$]*\$', sql[i:])
        if m:
            tag = m.group(0); in_dq = True
            current.append(tag); i += len(tag); continue
        # fim de statement
        if sql[i] == ';':
            s = ''.join(current).strip()
            if s:
                statements.append(s)
            current = []; i += 1; continue
        current.append(sql[i]); i += 1
    s = ''.join(current).strip()
    if s:
        statements.append(s)
    return statements


def executar_arquivo(cursor, path: str, dollar_safe: bool = False):
    with open(path, 'r', encoding='utf-8') as f:
        sql = f.read()
    splitter = split_sql_dollar_safe if dollar_safe else split_sql_simples
    for stmt in splitter(sql):
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
    print("   Cidades, aeroportos e idiomas serão preservados.")
    print("   O login de administrador será removido.\n")
    confirmacao = input("   Digite 'sim' para confirmar: ").strip().lower()
    if confirmacao != "sim":
        print("\nOperação cancelada.")
        return

    path_create  = os.path.join("database", "01_create.sql")
    path_objects = os.path.join("database", "03_objects.sql")

    print("\nConectando ao banco de dados...")
    try:
        with psycopg.connect(database_url) as conn:
            if schema_existe(conn):
                print("Schema 'airline' encontrado — limpando dados operacionais...")
                with conn.cursor() as cursor:
                    cursor.execute(TRUNCATE_SQL)
                conn.commit()
                print("  Dados operacionais removidos. Cidades, aeroportos e idiomas preservados.")
            else:
                # Primeira execução — schema não existe ainda
                if not os.path.exists(path_create):
                    print(f"ERRO: Arquivo não encontrado: {path_create}")
                    return
                print("Schema 'airline' não encontrado — criando estrutura do zero...")
                with conn.cursor() as cursor:
                    executar_arquivo(cursor, path_create, dollar_safe=False)
                    if os.path.exists(path_objects):
                        executar_arquivo(cursor, path_objects, dollar_safe=True)
                        print("  Views, índices e gatilhos criados.")
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
