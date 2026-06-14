# reset.py
import os
from decouple import config
import psycopg

def executar_reset():
    # 1. Puxa a URL de conexão do arquivo .env
    database_url = config("DATABASE_URL", default=None)
    
    if not database_url:
        print("❌ Erro: DATABASE_URL não encontrada no arquivo .env")
        return

    print("✈️ Conectando ao banco de dados remoto no Supabase...")
    
    try:
        # 2. Abre a conexão com o banco usando o driver psycopg moderno
        with psycopg.connect(database_url) as conn:
            with conn.cursor() as cursor:
                
                # 3. Ler e executar o arquivo de Criação de Tabelas (01_create.sql)
                path_create = os.path.join("database", "01_create.sql")
                print(f"📦 Executando {path_create}...")
                with open(path_create, "r", encoding="utf-8") as f:
                    sql_create = f.read()
                    cursor.execute(sql_create)
                
                # 4. Ler e executar o arquivo de Carga de Dados (02_insert.sql)
                path_insert = os.path.join("database", "02_insert.sql")
                print(f"📥 Executando {path_insert}...")
                with open(path_insert, "r", encoding="utf-8") as f:
                    sql_insert = f.read()
                    cursor.execute(sql_insert)
                    
            # Confirma todas as alterações na nuvem
            conn.commit()
            print("🏆 Banco de dados resetado e populado com sucesso na nuvem!")
            
    except Exception as e:
        print(f"❌ Ocorreu um erro durante o reset: {e}")

if __name__ == "__main__":
    executar_reset()