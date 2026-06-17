# Airlines Company

Sistema de gerenciamento de companhia aérea desenvolvido como Projeto Final da disciplina de Banco de Dados — UECE.

**Equipe:** Apolo Victor, Camila Pinheiro, Davi Jannsen, David Moreira.

---

## Tecnologias utilizadas

| Camada | Tecnologia |
|---|---|
| Frontend | React 18 + Vite 5 + Tailwind CSS |
| Backend / API | Python 3.14 + Django 5 + Django REST Framework |
| Autenticação | JWT (djangorestframework-simplejwt) |
| Banco de dados | PostgreSQL (hospedado no Supabase) |
| Driver DB | psycopg3 (raw SQL, sem ORM) |

---

## Pré-requisitos

Antes de começar, certifique-se de ter instalado:

- [Python 3.14+](https://www.python.org/downloads/)
- [uv](https://docs.astral.sh/uv/getting-started/installation/) — gerenciador de pacotes Python
- [Node.js 18+](https://nodejs.org/) e npm

---

## Configuração do ambiente

### 1. Clone o repositório

```bash
git clone https://github.com/DaviJannsen/Airlines-Company.git
cd Airlines-Company
```

### 2. Crie o arquivo `.env` na raiz do projeto

```env
DJANGO_SECRET_KEY=uece_airlines_secret_key_2026
DJANGO_DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

DB_NAME=postgres
DB_USER=postgres.xxxxxxxxxxxx
DB_HOST=aws-0-us-east-1.pooler.supabase.com
DB_PORT=5432
DB_PASSWORD=sua_senha_aqui

DATABASE_URL=postgresql://postgres.xxxxxxxxxxxx:sua_senha_aqui@aws-0-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require

JWT_ACCESS_TOKEN_LIFETIME_MINUTES=60
JWT_REFRESH_TOKEN_LIFETIME_DAYS=7
```

> As credenciais reais do banco serão fornecidas pela equipe separadamente.

---

## Executando o projeto

O projeto tem duas partes que precisam rodar ao mesmo tempo: o **backend** e o **frontend**.

### Backend (Django)

Em um terminal, na raiz do projeto:

```bash
# Instala as dependências Python
uv sync

# Sobe o servidor backend na porta 8000
uv run python manage.py runserver
```

O backend estará disponível em: `http://127.0.0.1:8000`

---

### Banco de dados (popular dados de exemplo)

Com o backend rodando, em outro terminal:

```bash
# Popula o banco com dados de demonstração
uv run python populate.py

# Se precisar resetar e começar do zero:
uv run python reset.py
```

> O `populate.py` executa os arquivos SQL na ordem correta:
> `01_create.sql` → `02_insert.sql` → `03_objects.sql`

---

### Frontend (React)

Em outro terminal, dentro da pasta `frontend/`:

```bash
cd frontend

# Instala as dependências Node
npm install

# Sobe o servidor de desenvolvimento na porta 5173
npm run dev
```

O frontend estará disponível em: `http://localhost:5173`

---

## Primeiro acesso

Ao abrir o sistema pela primeira vez, será necessário criar o usuário administrador:

1. Acesse `http://localhost:5173`
2. Clique em **"Configurar administrador"**
3. Preencha nome, usuário e senha
4. Faça login com as credenciais criadas

---

## Arquitetura de pastas

```
Airlines-Company/
│
├── backend/                        # Código Python do servidor
│   └── src/config/
│       ├── controllers/            # Recebem as requisições HTTP e devolvem JSON
│       │   ├── auth_controller.py      → login, cadastro, JWT
│       │   ├── admin_controller.py     → painel do administrador
│       │   ├── passageiro_controller.py→ painel do passageiro
│       │   └── voo_controller.py       → listagem de voos
│       └── services/               # Lógica de negócio e SQL
│           ├── auth_services.py        → autenticação
│           ├── voo_service.py          → voos, aeronaves, relatórios
│           ├── passageiro_service.py   → reservas, embarque, perfil
│           └── funcionario_service.py  → pilotos, comissários, escala
│
├── core/                           # Configurações do Django
│   ├── settings.py                     → configurações gerais
│   └── urls.py                         → roteamento principal
│
├── database/                       # Arquivos SQL
│   ├── 01_create.sql                   → criação das tabelas (DDL)
│   ├── 02_insert.sql                   → dados de exemplo (seed)
│   ├── 03_objects.sql                  → views, índices e triggers
│   └── 04_tests.sql                    → consultas de teste
│
├── frontend/                       # Código React
│   └── src/
│       ├── api/
│       │   └── axios.js                → cliente HTTP centralizado (injeta JWT)
│       ├── contexts/
│       │   └── AuthContext.jsx         → estado global de autenticação
│       ├── components/
│       │   ├── Navbar.jsx              → barra de navegação
│       │   └── ProtectedRoute.jsx      → bloqueio de rotas por papel (role)
│       └── pages/
│           ├── HomePublica.jsx         → página inicial (busca de voos)
│           ├── Login.jsx               → login do passageiro
│           ├── Cadastro.jsx            → cadastro de novo passageiro
│           ├── AdminLogin.jsx          → login do administrador
│           ├── AdminSetup.jsx          → criação do primeiro admin
│           ├── DashboardAdmin.jsx      → painel completo do administrador
│           └── DashboardPassageiro.jsx → painel do passageiro
│
├── permissions.py                  # Autenticação JWT customizada (IsAdmin / IsPassenger)
├── manage.py                       # CLI do Django (runserver, migrate, etc.)
├── populate.py                     # Script para popular o banco com dados de exemplo
├── reset.py                        # Script para resetar o banco
└── pyproject.toml                  # Dependências Python (gerenciado pelo uv)
```

---

## Fluxo da aplicação

```
Usuário no browser (porta 5173)
        │
        │  HTTP + JWT
        ▼
  Django REST API (porta 8000)
        │
        │  psycopg3 (SQL puro)
        ▼
  PostgreSQL no Supabase (remoto)
        │
        │  PL/pgSQL
        └─ Triggers, Views, Índices
```

---

## Funcionalidades demonstráveis

### Painel do Passageiro
- Cadastro e login com CPF, Passaporte ou DNI
- Busca e reserva de voos com seleção de classe e bagagem
- Histórico de reservas
- Edição de perfil

### Painel do Administrador
- Gerenciamento de voos (criar, listar, atualizar status)
- Gerenciamento de aeronaves e modelos
- Gerenciamento de funcionários (pilotos e comissários)
- Escala de tripulação por voo
- Controle de embarque (autorizar, negar, confirmar pagamento)
- Relatórios com JOIN, GROUP BY, HAVING e funções de agregação

### Banco de dados
- 6 triggers ativos (validação de habilitação, certificado, capacidade, cancelamento, manutenção e composição mínima de voo)
- 2 views (`vw_painel_voos`, `vw_ocupacao_por_classe`)
- 3 índices de performance
