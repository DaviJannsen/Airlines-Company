-- ============================================================
-- TP3 — Modelo Físico em PostgreSQL
-- Sistema de Gerenciamento de Companhia Aérea
-- Equipe 1: Camila Pinheiro, Davi Jannsen, David Moreira, Apolo Victor
-- Arquivo: 03_objects.sql
-- ============================================================

SET search_path = airline;

-- ============================================================
-- VIEW 1: vw_painel_voos
-- Justificativa: Consolida em uma única consulta todas as
-- informações operacionais de um voo — rota, aeronave, lotação
-- confirmada e tripulação escalada — eliminando joins repetitivos
-- nas aplicações front-end e relatórios gerenciais.
-- ============================================================
CREATE OR REPLACE VIEW vw_painel_voos AS
SELECT
    v.num_voo,
    v.tipo_voo,
    v.data_partida,
    v.hora_partida,
    v.previsao_chegada,
    v.status_voo,
    t.codigo_IATA_origem  AS origem,
    t.codigo_IATA_destino AS destino,
    t.distancia_km,
    v.cod_aeronave,
    ma.modelo             AS modelo_aeronave,
    ma.capacidade         AS capacidade_maxima,
    COUNT(DISTINCT da.id_passagem) AS passagens_vendidas,
    COUNT(DISTINCT et.id_funcionario) AS tripulacao_escalada
FROM Voo v
JOIN Trecho t        ON t.num_voo = v.num_voo
JOIN Aeronave a      ON a.cod_aeronave = v.cod_aeronave
JOIN Modelo_Aeronave ma ON ma.modelo = a.modelo
LEFT JOIN Destinado_A da ON da.num_voo = v.num_voo
LEFT JOIN Escala_Trabalho et ON et.num_voo = v.num_voo
GROUP BY
    v.num_voo, v.tipo_voo, v.data_partida, v.hora_partida,
    v.previsao_chegada, v.status_voo,
    t.codigo_IATA_origem, t.codigo_IATA_destino, t.distancia_km,
    v.cod_aeronave, ma.modelo, ma.capacidade;

-- ============================================================
-- VIEW 2: vw_ocupacao_por_classe
-- Justificativa: Auxilia o setor de revenue management a
-- acompanhar a distribuição de passagens vendidas por classe
-- de cabine em cada voo, calculando a taxa de ocupação.
-- ============================================================
CREATE OR REPLACE VIEW vw_ocupacao_por_classe AS
SELECT
    da.num_voo,
    p.classe_cabine,
    COUNT(p.id_passagem)                         AS qtd_passagens,
    SUM(r.valor_total)                           AS receita_classe,
    ROUND(AVG(r.valor_total), 2)                 AS ticket_medio
FROM Passagem p
JOIN Destinado_A da       ON da.id_passagem = p.id_passagem
JOIN Reserva r            ON r.codigo_localizador = p.codigo_localizador
GROUP BY da.num_voo, p.classe_cabine;

-- ============================================================
-- ÍNDICE 1: idx_voo_data_status
-- Justificativa: Consultas de painel operacional filtram voos
-- pela data de partida e/ou status com alta frequência.
-- Um índice composto em (data_partida, status_voo) evita
-- full-scans na tabela Voo para estas consultas recorrentes.
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_voo_data_status
    ON Voo (data_partida, status_voo);

-- ============================================================
-- ÍNDICE 2: idx_passagem_passageiro
-- Justificativa: Buscas de histórico de viagens de um passageiro
-- percorrem a tabela Passagem filtrando por id_passageiro.
-- O índice acelera essas consultas sem necessidade de seq scan.
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_passagem_passageiro
    ON Passagem (id_passageiro);

-- ============================================================
-- ÍNDICE 3: idx_trecho_voo
-- Justificativa: A tabela Trecho é frequentemente consultada
-- junto com Voo via JOIN por num_voo; o índice elimina buscas
-- sequenciais nessa coluna de FK.
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_trecho_voo
    ON Trecho (num_voo);

-- ============================================================
-- GATILHO 1: trg_valida_habilitacao_piloto
-- Descrição: Antes de inserir ou atualizar um registro na tabela
-- Piloto, verifica se a validade_habilitacao não está vencida.
-- Caso esteja, levanta uma exceção impedindo o DML e registrando
-- o alerta — garantindo que nenhum piloto com habilitação
-- expirada seja cadastrado ou mantido ativo no sistema.
-- ============================================================
CREATE OR REPLACE FUNCTION fn_valida_habilitacao_piloto()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.validade_habilitacao < CURRENT_DATE THEN
        RAISE EXCEPTION
            'Habilitação vencida para o piloto id=%. Validade: %. Data atual: %.',
            NEW.id_funcionario,
            NEW.validade_habilitacao,
            CURRENT_DATE;
    END IF;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_valida_habilitacao_piloto
BEFORE INSERT OR UPDATE ON Piloto
FOR EACH ROW
EXECUTE FUNCTION fn_valida_habilitacao_piloto();

-- ============================================================
-- GATILHO 2 (extra): trg_valida_certificado_comissario
-- Descrição: Antes de inserir ou atualizar um registro na tabela
-- Comissario, verifica se a validade_certificado não está vencida.
-- Espelho do trg_valida_habilitacao_piloto para garantir que
-- comissários com certificado expirado também sejam bloqueados.
-- ============================================================
CREATE OR REPLACE FUNCTION fn_valida_certificado_comissario()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.validade_certificado < CURRENT_DATE THEN
        RAISE EXCEPTION
            'Certificado vencido para o comissário id=%. Validade: %. Data atual: %.',
            NEW.id_funcionario,
            NEW.validade_certificado,
            CURRENT_DATE;
    END IF;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_valida_certificado_comissario
BEFORE INSERT OR UPDATE ON Comissario
FOR EACH ROW
EXECUTE FUNCTION fn_valida_certificado_comissario();

-- ============================================================
-- GATILHO 3: trg_atualiza_aviso_manutencao
-- Descrição: Após atualizar data_ultima_manutencao em Aeronave,
-- calcula automaticamente se a aeronave está próxima ou acima
-- do limite de manutenção (180 dias). Se sim, define
-- aviso_manutencao = TRUE; caso contrário, FALSE.
-- Simula regra de negócio real de monitoramento de frota.
-- ============================================================
CREATE OR REPLACE FUNCTION fn_atualiza_aviso_manutencao()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.data_ultima_manutencao IS NOT NULL THEN
        IF (CURRENT_DATE - NEW.data_ultima_manutencao) >= 180 THEN
            NEW.aviso_manutencao := TRUE;
        ELSE
            NEW.aviso_manutencao := FALSE;
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_atualiza_aviso_manutencao
BEFORE INSERT OR UPDATE OF data_ultima_manutencao ON Aeronave
FOR EACH ROW
EXECUTE FUNCTION fn_atualiza_aviso_manutencao();

-- ============================================================
-- GATILHO 3: trg_log_cancelamento_voo
-- Descrição: Quando o status_voo for alterado para 'Cancelado',
-- preenche automaticamente data_hora_efetiva_cancelamento com
-- o timestamp atual, caso ainda esteja NULL. Evita que voos
-- cancelados fiquem sem registro temporal do cancelamento.
-- ============================================================
CREATE OR REPLACE FUNCTION fn_log_cancelamento_voo()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.status_voo = 'Cancelado'
       AND OLD.status_voo <> 'Cancelado'
       AND NEW.data_hora_efetiva_cancelamento IS NULL
    THEN
        NEW.data_hora_efetiva_cancelamento := NOW();
    END IF;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_log_cancelamento_voo
BEFORE UPDATE OF status_voo ON Voo
FOR EACH ROW
EXECUTE FUNCTION fn_log_cancelamento_voo();

-- ============================================================
-- GATILHO 4: trg_valida_capacidade_voo
-- Descrição: Antes de inserir em Destinado_A, verifica se
-- o número de passagens já emitidas para o voo não atingiu
-- a capacidade máxima da aeronave. Garante a restrição no
-- banco independentemente da camada de aplicação.
-- ============================================================
CREATE OR REPLACE FUNCTION fn_valida_capacidade_voo()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_capacidade INTEGER;
    v_emitidas   INTEGER;
BEGIN
    SELECT ma.capacidade INTO v_capacidade
    FROM airline.voo v
    JOIN airline.aeronave a         ON a.cod_aeronave = v.cod_aeronave
    JOIN airline.modelo_aeronave ma ON ma.modelo = a.modelo
    WHERE v.num_voo = NEW.num_voo;

    SELECT COUNT(*) INTO v_emitidas
    FROM airline.destinado_a
    WHERE num_voo = NEW.num_voo;

    IF v_emitidas >= v_capacidade THEN
        RAISE EXCEPTION
            'Capacidade máxima atingida: voo % já possui % de % passagens permitidas.',
            NEW.num_voo, v_emitidas, v_capacidade;
    END IF;

    RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_valida_capacidade_voo
BEFORE INSERT ON Destinado_A
FOR EACH ROW
EXECUTE FUNCTION fn_valida_capacidade_voo();

-- ============================================================
-- GATILHO 6: trg_valida_composicao_voo
-- Descrição: Antes de mover o status_voo para 'Em Voo', verifica
-- se o voo possui ao menos 1 piloto escalado, 1 comissário
-- escalado e 1 passageiro com passagem emitida. Impede que um
-- voo "decole" sem tripulação mínima ou sem passageiros.
-- ============================================================
CREATE OR REPLACE FUNCTION fn_valida_composicao_voo()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_pilotos     INTEGER;
    v_comissarios INTEGER;
    v_passageiros INTEGER;
BEGIN
    IF NEW.status_voo = 'Em Voo' AND OLD.status_voo <> 'Em Voo' THEN

        SELECT COUNT(*) INTO v_pilotos
        FROM airline.escala_trabalho et
        INNER JOIN airline.piloto p ON p.id_funcionario = et.id_funcionario
        WHERE et.num_voo = NEW.num_voo;

        IF v_pilotos < 1 THEN
            RAISE EXCEPTION
                'Voo % não pode iniciar: nenhum piloto escalado.',
                NEW.num_voo;
        END IF;

        SELECT COUNT(*) INTO v_comissarios
        FROM airline.escala_trabalho et
        INNER JOIN airline.comissario c ON c.id_funcionario = et.id_funcionario
        WHERE et.num_voo = NEW.num_voo;

        IF v_comissarios < 1 THEN
            RAISE EXCEPTION
                'Voo % não pode iniciar: nenhum comissário escalado.',
                NEW.num_voo;
        END IF;

        SELECT COUNT(*) INTO v_passageiros
        FROM airline.destinado_a da
        INNER JOIN airline.passagem  p  ON p.id_passagem       = da.id_passagem
        INNER JOIN airline.reserva   r  ON r.codigo_localizador = p.codigo_localizador
        LEFT  JOIN airline.controle_embarque ce
               ON ce.id_passagem = da.id_passagem AND ce.num_voo = da.num_voo
        WHERE da.num_voo = NEW.num_voo
          AND (r.status_pagamento = 'Pago' OR ce.status_autorizacao = 'Autorizado');

        IF v_passageiros < 1 THEN
            RAISE EXCEPTION
                'Voo % não pode iniciar: nenhum passageiro com pagamento confirmado ou embarque autorizado.',
                NEW.num_voo;
        END IF;

    END IF;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_valida_composicao_voo
BEFORE UPDATE OF status_voo ON Voo
FOR EACH ROW
EXECUTE FUNCTION fn_valida_composicao_voo();
