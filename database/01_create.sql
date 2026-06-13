-- ============================================================
-- TP3 — Modelo Físico em PostgreSQL
-- Sistema de Gerenciamento de Companhia Aérea
-- Equipe 1: Camila Pinheiro, Davi Jannsen, David Moreira, Apolo Victor
-- Arquivo: 01_create.sql
-- ============================================================

-- ------------------------------------------------------------
-- 0. LIMPEZA — remoção completa do schema para recriação
-- ------------------------------------------------------------
DROP SCHEMA IF EXISTS airline CASCADE;
CREATE SCHEMA airline;
SET search_path = airline;

-- ------------------------------------------------------------
-- 1. CIDADE
-- ------------------------------------------------------------
CREATE TABLE Cidade (
    id_cidade          SERIAL          NOT NULL,
    nome_cidade        VARCHAR(100)    NOT NULL,
    pais               VARCHAR(100)    NOT NULL,
    clima_predominante VARCHAR(20)     NULL,
    idioma_local       VARCHAR(10)     NULL,

    CONSTRAINT pk_cidade PRIMARY KEY (id_cidade)
);

-- ------------------------------------------------------------
-- 2. AEROPORTO
-- ------------------------------------------------------------
CREATE TABLE Aeroporto (
    codigo_IATA       CHAR(3)         NOT NULL,
    nome_aeroporto    VARCHAR(150)    NOT NULL,
    capacidade_pistas INTEGER         NOT NULL CHECK (capacidade_pistas > 0),
    id_cidade         INTEGER         NOT NULL,
    altitude_pista_pes INTEGER        NULL CHECK (altitude_pista_pes >= 0),
    site_aeroporto    VARCHAR(255)    NULL,

    CONSTRAINT pk_aeroporto   PRIMARY KEY (codigo_IATA),
    CONSTRAINT fk_aero_cidade FOREIGN KEY (id_cidade)
        REFERENCES Cidade(id_cidade) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT ck_iata_upper  CHECK (codigo_IATA = UPPER(codigo_IATA))
);

-- ------------------------------------------------------------
-- 3. MODELO_AERONAVE
-- ------------------------------------------------------------
CREATE TABLE Modelo_Aeronave (
    modelo      VARCHAR(80)     NOT NULL,
    fabricante  VARCHAR(100)    NOT NULL,
    capacidade  INTEGER         NOT NULL CHECK (capacidade > 0),
    kms_rodados INTEGER         NULL     CHECK (kms_rodados >= 0),
    preco       NUMERIC(15,2)   NULL     CHECK (preco > 0),

    CONSTRAINT pk_modelo_aeronave PRIMARY KEY (modelo)
);

-- ------------------------------------------------------------
-- 4. AERONAVE
-- ------------------------------------------------------------
CREATE TABLE Aeronave (
    cod_aeronave           VARCHAR(20)  NOT NULL,
    modelo                 VARCHAR(80)  NOT NULL,
    aviso_manutencao       BOOLEAN      NULL DEFAULT FALSE,
    data_ultima_manutencao DATE         NULL,

    CONSTRAINT pk_aeronave    PRIMARY KEY (cod_aeronave),
    CONSTRAINT fk_aero_modelo FOREIGN KEY (modelo)
        REFERENCES Modelo_Aeronave(modelo) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- ------------------------------------------------------------
-- 5. VOO
-- ------------------------------------------------------------
CREATE TABLE Voo (
    num_voo                         VARCHAR(10)  NOT NULL,
    tipo_voo                        VARCHAR(15)  NOT NULL,
    data_partida                    DATE         NOT NULL,
    status_voo                      VARCHAR(15)  NOT NULL DEFAULT 'Programado',
    hora_partida                    TIME         NOT NULL,
    previsao_chegada                TIMESTAMP    NOT NULL,
    cod_aeronave                    VARCHAR(20)  NOT NULL,
    data_hora_efetiva_cancelamento  TIMESTAMP    NULL,
    motivo_atraso_cancelamento      VARCHAR(300) NULL,

    CONSTRAINT pk_voo          PRIMARY KEY (num_voo),
    CONSTRAINT fk_voo_aeronave FOREIGN KEY (cod_aeronave)
        REFERENCES Aeronave(cod_aeronave) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT ck_tipo_voo     CHECK (tipo_voo IN ('Nacional', 'Internacional')),
    CONSTRAINT ck_status_voo   CHECK (status_voo IN ('Programado','Em Voo','Concluído','Cancelado','Atrasado')),
    CONSTRAINT ck_chegada_apos_partida
        CHECK (previsao_chegada > (data_partida + hora_partida))
);

-- ------------------------------------------------------------
-- 6. TRECHO
-- ------------------------------------------------------------
CREATE TABLE Trecho (
    codigo_trecho        SERIAL          NOT NULL,
    tipo_trecho          VARCHAR(50)     NOT NULL,
    distancia_km         NUMERIC(8,2)    NOT NULL CHECK (distancia_km > 0),
    codigo_IATA_origem   CHAR(3)         NOT NULL,
    codigo_IATA_destino  CHAR(3)         NOT NULL,
    num_voo              VARCHAR(10)     NOT NULL,
    status_sazonalidade  VARCHAR(12)     NULL DEFAULT 'Normal',
    via_aerea_regulamentada BOOLEAN      NULL DEFAULT TRUE,

    CONSTRAINT pk_trecho          PRIMARY KEY (codigo_trecho),
    CONSTRAINT fk_trecho_origem   FOREIGN KEY (codigo_IATA_origem)
        REFERENCES Aeroporto(codigo_IATA) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_trecho_destino  FOREIGN KEY (codigo_IATA_destino)
        REFERENCES Aeroporto(codigo_IATA) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_trecho_voo      FOREIGN KEY (num_voo)
        REFERENCES Voo(num_voo) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT ck_sazonalidade    CHECK (status_sazonalidade IN ('Normal','Conturbado')),
    CONSTRAINT ck_origem_diferente_destino
        CHECK (codigo_IATA_origem <> codigo_IATA_destino)
);

-- ------------------------------------------------------------
-- 7. COMISSAO_DE_BORDO  (superclasse de funcionários)
-- ------------------------------------------------------------
CREATE TABLE Comissao_De_Bordo (
    id_funcionario  SERIAL          NOT NULL,
    cpf             CHAR(11)        NOT NULL,
    nome_completo   VARCHAR(150)    NOT NULL,
    data_admissao   DATE            NOT NULL,
    salario_base    NUMERIC(10,2)   NOT NULL CHECK (salario_base > 0),

    CONSTRAINT pk_comissao      PRIMARY KEY (id_funcionario),
    CONSTRAINT uq_cpf           UNIQUE (cpf),
    CONSTRAINT ck_cpf_numerico  CHECK (cpf ~ '^[0-9]{11}$')
);

-- ------------------------------------------------------------
-- 8. PILOTO  (subclasse exclusiva)
-- ------------------------------------------------------------
CREATE TABLE Piloto (
    id_funcionario      INTEGER         NOT NULL,
    licenca_piloto      VARCHAR(30)     NOT NULL,
    validade_habilitacao DATE           NOT NULL,

    CONSTRAINT pk_piloto         PRIMARY KEY (id_funcionario),
    CONSTRAINT fk_piloto_func    FOREIGN KEY (id_funcionario)
        REFERENCES Comissao_De_Bordo(id_funcionario) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT uq_licenca_piloto UNIQUE (licenca_piloto)
);

-- ------------------------------------------------------------
-- 9. COMISSARIO  (subclasse exclusiva)
-- ------------------------------------------------------------
CREATE TABLE Comissario (
    id_funcionario       INTEGER  NOT NULL,
    validade_certificado DATE     NOT NULL,

    CONSTRAINT pk_comissario      PRIMARY KEY (id_funcionario),
    CONSTRAINT fk_comissario_func FOREIGN KEY (id_funcionario)
        REFERENCES Comissao_De_Bordo(id_funcionario) ON DELETE CASCADE ON UPDATE CASCADE
);

-- ------------------------------------------------------------
-- 10. IDIOMA
-- ------------------------------------------------------------
CREATE TABLE Idioma (
    cod_idioma  SERIAL       NOT NULL,
    nome        VARCHAR(80)  NOT NULL,

    CONSTRAINT pk_idioma PRIMARY KEY (cod_idioma)
);

-- ------------------------------------------------------------
-- 11. FUNCIONARIO_IDIOMA
-- ------------------------------------------------------------
CREATE TABLE Funcionario_Idioma (
    id_funcionario        INTEGER      NOT NULL,
    cod_idioma            INTEGER      NOT NULL,
    nivel_fluencia        VARCHAR(15)  NOT NULL,
    instituicao_certificado VARCHAR(100) NULL,

    CONSTRAINT pk_func_idioma      PRIMARY KEY (id_funcionario, cod_idioma),
    CONSTRAINT fk_fi_funcionario   FOREIGN KEY (id_funcionario)
        REFERENCES Comissao_De_Bordo(id_funcionario) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_fi_idioma        FOREIGN KEY (cod_idioma)
        REFERENCES Idioma(cod_idioma) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT ck_nivel_fluencia   CHECK (nivel_fluencia IN ('Básico','Intermediário','Avançado','Nativo'))
);

-- ------------------------------------------------------------
-- 12. ESCALA_TRABALHO
-- ------------------------------------------------------------
CREATE TABLE Escala_Trabalho (
    id_funcionario  INTEGER     NOT NULL,
    num_voo         VARCHAR(10) NOT NULL,
    codigo_IATA     CHAR(3)     NOT NULL,

    CONSTRAINT pk_escala           PRIMARY KEY (id_funcionario, num_voo, codigo_IATA),
    CONSTRAINT fk_escala_func      FOREIGN KEY (id_funcionario)
        REFERENCES Comissao_De_Bordo(id_funcionario) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_escala_voo       FOREIGN KEY (num_voo)
        REFERENCES Voo(num_voo) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_escala_aeroporto FOREIGN KEY (codigo_IATA)
        REFERENCES Aeroporto(codigo_IATA) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- ------------------------------------------------------------
-- 13. PASSAGEIRO
-- ------------------------------------------------------------
CREATE TABLE Passageiro (
    id_passageiro        SERIAL        NOT NULL,
    nome_completo        VARCHAR(150)  NOT NULL,
    data_nascimento      DATE          NOT NULL,
    nacionalidade        VARCHAR(80)   NOT NULL,
    documento_identidade VARCHAR(50)   NOT NULL,
    contato_emergencia   VARCHAR(20)   NULL,
    necessidades_especiais BOOLEAN     NULL DEFAULT FALSE,

    CONSTRAINT pk_passageiro       PRIMARY KEY (id_passageiro),
    CONSTRAINT uq_documento_ident  UNIQUE (documento_identidade)
);

-- ------------------------------------------------------------
-- 14. RESERVA
-- ------------------------------------------------------------
CREATE TABLE Reserva (
    codigo_localizador  VARCHAR(20)    NOT NULL,
    data_criacao        DATE           NOT NULL DEFAULT CURRENT_DATE,
    status_pagamento    VARCHAR(15)    NOT NULL DEFAULT 'Pendente',
    valor_total         NUMERIC(10,2)  NOT NULL CHECK (valor_total >= 0),
    agencia_parceira    BOOLEAN        NULL DEFAULT FALSE,
    cupom_desconto      BOOLEAN        NULL DEFAULT FALSE,

    CONSTRAINT pk_reserva           PRIMARY KEY (codigo_localizador),
    CONSTRAINT ck_status_pagamento  CHECK (status_pagamento IN ('Pendente','Pago','Cancelado','Reembolsado'))
);

-- ------------------------------------------------------------
-- 15. PASSAGEM
-- ------------------------------------------------------------
CREATE TABLE Passagem (
    id_passagem          SERIAL        NOT NULL,
    classe_cabine        VARCHAR(15)   NOT NULL,
    assento_passageiro   VARCHAR(5)    NOT NULL,
    id_passageiro        INTEGER       NOT NULL,
    codigo_localizador   VARCHAR(20)   NOT NULL,
    bagagem_despachada   BOOLEAN       NULL DEFAULT FALSE,
    peso_bagagem         NUMERIC(5,2)  NULL CHECK (peso_bagagem >= 0),

    CONSTRAINT pk_passagem          PRIMARY KEY (id_passagem),
    CONSTRAINT fk_pass_passageiro   FOREIGN KEY (id_passageiro)
        REFERENCES Passageiro(id_passageiro) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_pass_reserva      FOREIGN KEY (codigo_localizador)
        REFERENCES Reserva(codigo_localizador) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT ck_classe_cabine     CHECK (classe_cabine IN ('Econômica','Executiva','Primeira Classe'))
);

-- ------------------------------------------------------------
-- 16. DESTINADO_A
-- ------------------------------------------------------------
CREATE TABLE Destinado_A (
    id_passagem  INTEGER     NOT NULL,
    num_voo      VARCHAR(10) NOT NULL,

    CONSTRAINT pk_destinado_a     PRIMARY KEY (id_passagem, num_voo),
    CONSTRAINT fk_dest_passagem   FOREIGN KEY (id_passagem)
        REFERENCES Passagem(id_passagem) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_dest_voo        FOREIGN KEY (num_voo)
        REFERENCES Voo(num_voo) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- ------------------------------------------------------------
-- 17. CONTROLE_EMBARQUE
-- ------------------------------------------------------------
CREATE TABLE Controle_Embarque (
    id_controle_embarque        SERIAL        NOT NULL,
    data_hora_passagem_gate     TIMESTAMP     NOT NULL,
    status_presenca_passageiro  VARCHAR(10)   NOT NULL DEFAULT 'Em Espera',
    status_autorizacao          VARCHAR(10)   NOT NULL DEFAULT 'Pendente',
    num_voo                     VARCHAR(10)   NOT NULL,
    id_passagem                 INTEGER       NOT NULL,
    motivo_impedimento_embarque VARCHAR(300)  NULL,

    CONSTRAINT pk_controle_embarque  PRIMARY KEY (id_controle_embarque),
    CONSTRAINT uq_voo_passagem       UNIQUE (num_voo, id_passagem),
    CONSTRAINT fk_ce_voo             FOREIGN KEY (num_voo)
        REFERENCES Voo(num_voo) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_ce_passagem        FOREIGN KEY (id_passagem)
        REFERENCES Passagem(id_passagem) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT ck_status_presenca    CHECK (status_presenca_passageiro IN ('Presente','Ausente','Em Espera')),
    CONSTRAINT ck_status_autorizacao CHECK (status_autorizacao IN ('Autorizado','Negado','Pendente'))
);
