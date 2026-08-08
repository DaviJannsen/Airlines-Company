-- ============================================================
-- Migracao — Autenticacao real (backend Java / Spring Security)
-- Equipe 1: Camila Pinheiro, Davi Jannsen, David Moreira, Apolo Victor
-- Arquivo: 05_auth.sql
--
-- Contexto: o backend Django original nao possuia senha real para
-- passageiros (comparava o proprio documento_identidade em texto puro)
-- e delegava a autenticacao de administradores para a tabela nativa
-- auth_user do Django. A reescrita em Spring Boot implementa hash de
-- senha (BCrypt) para ambos os perfis, exigindo duas mudancas no
-- modelo fisico:
--   1) Passageiro passa a ter uma senha propria, hasheada.
--   2) Uma tabela Usuario substitui o auth_user do Django para as
--      contas administrativas.
-- ============================================================

SET search_path = airline;

-- ------------------------------------------------------------
-- 1. PASSAGEIRO — coluna de senha (hash BCrypt)
-- ------------------------------------------------------------
ALTER TABLE Passageiro
    ADD COLUMN IF NOT EXISTS senha_hash VARCHAR(255);

-- ------------------------------------------------------------
-- 2. USUARIO — contas administrativas (substitui auth_user)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS Usuario (
    id_usuario     SERIAL          NOT NULL,
    username       VARCHAR(60)     NOT NULL,
    senha_hash     VARCHAR(255)    NOT NULL,
    nome_completo  VARCHAR(150)    NOT NULL,
    email          VARCHAR(150)    NULL,
    super_admin    BOOLEAN         NOT NULL DEFAULT FALSE,

    CONSTRAINT pk_usuario          PRIMARY KEY (id_usuario),
    CONSTRAINT uq_usuario_username UNIQUE (username)
);
