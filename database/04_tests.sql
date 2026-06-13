-- ============================================================
-- TP3 — Modelo Físico em PostgreSQL
-- Sistema de Gerenciamento de Companhia Aérea
-- Equipe 1: Camila Pinheiro, Davi Jannsen, David Moreira, Apolo Victor
-- Arquivo: 04_tests.sql
-- ============================================================

SET search_path = airline;

-- ============================================================
-- T1. CONSULTA COM JOIN
-- Lista todos os voos com aeroporto de origem/destino e modelo
-- da aeronave designada.
-- ============================================================
SELECT
    v.num_voo,
    v.tipo_voo,
    v.data_partida,
    v.hora_partida,
    v.status_voo,
    t.codigo_IATA_origem  AS origem,
    ao.nome_aeroporto     AS aeroporto_origem,
    t.codigo_IATA_destino AS destino,
    ad.nome_aeroporto     AS aeroporto_destino,
    t.distancia_km,
    v.cod_aeronave,
    ma.modelo             AS modelo_aeronave
FROM Voo v
JOIN Trecho t          ON t.num_voo = v.num_voo
JOIN Aeroporto ao      ON ao.codigo_IATA = t.codigo_IATA_origem
JOIN Aeroporto ad      ON ad.codigo_IATA = t.codigo_IATA_destino
JOIN Aeronave a        ON a.cod_aeronave = v.cod_aeronave
JOIN Modelo_Aeronave ma ON ma.modelo = a.modelo
ORDER BY v.data_partida, v.hora_partida;

-- ============================================================
-- T2. CONSULTA COM GROUP BY E FUNÇÃO DE AGREGAÇÃO
-- Total de passagens vendidas, receita total e ticket médio
-- por voo, ordenado por receita decrescente.
-- ============================================================
SELECT
    da.num_voo,
    COUNT(p.id_passagem)         AS total_passagens,
    SUM(r.valor_total)           AS receita_total,
    ROUND(AVG(r.valor_total), 2) AS ticket_medio,
    MIN(r.valor_total)           AS menor_valor,
    MAX(r.valor_total)           AS maior_valor
FROM Destinado_A da
JOIN Passagem p ON p.id_passagem = da.id_passagem
JOIN Reserva r  ON r.codigo_localizador = p.codigo_localizador
GROUP BY da.num_voo
ORDER BY receita_total DESC;

-- ============================================================
-- T3. CONSULTA COM HAVING
-- Voos com mais de 1 passageiro confirmado (Presente no gate).
-- ============================================================
SELECT
    ce.num_voo,
    COUNT(ce.id_passagem) AS passageiros_presentes
FROM Controle_Embarque ce
WHERE ce.status_presenca_passageiro = 'Presente'
GROUP BY ce.num_voo
HAVING COUNT(ce.id_passagem) > 1
ORDER BY passageiros_presentes DESC;

-- ============================================================
-- T4. SUBCONSULTA
-- Lista passageiros que possuem passagem em pelo menos um
-- voo internacional.
-- ============================================================
SELECT
    pa.id_passageiro,
    pa.nome_completo,
    pa.nacionalidade,
    pa.documento_identidade
FROM Passageiro pa
WHERE pa.id_passageiro IN (
    SELECT p.id_passageiro
    FROM Passagem p
    JOIN Destinado_A da ON da.id_passagem = p.id_passagem
    JOIN Voo v          ON v.num_voo = da.num_voo
    WHERE v.tipo_voo = 'Internacional'
);

-- ============================================================
-- T5. USO DA VIEW vw_painel_voos
-- Exibe o painel operacional dos voos programados para a
-- próxima semana com taxa de ocupação calculada.
-- ============================================================
SELECT
    num_voo,
    tipo_voo,
    data_partida,
    hora_partida,
    origem || ' → ' || destino AS rota,
    status_voo,
    modelo_aeronave,
    capacidade_maxima,
    passagens_vendidas,
    tripulacao_escalada,
    ROUND((passagens_vendidas::NUMERIC / NULLIF(capacidade_maxima,0)) * 100, 1) AS ocupacao_pct
FROM vw_painel_voos
WHERE data_partida BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
ORDER BY data_partida, hora_partida;

-- ============================================================
-- T6. CONSULTA COMPATÍVEL COM O ÍNDICE idx_voo_data_status
-- Filtra voos por data e status — consulta que usa o índice
-- composto criado em 03_objects.sql.
-- ============================================================
EXPLAIN ANALYZE
SELECT num_voo, tipo_voo, hora_partida, cod_aeronave
FROM Voo
WHERE data_partida = '2026-06-15'
  AND status_voo = 'Programado';

-- ============================================================
-- T7. FUNCIONAMENTO DE RESTRIÇÃO DE INTEGRIDADE
-- Testa CHECK constraint: origem ≠ destino em Trecho.
-- Deve falhar com "new row for relation violates check constraint".
-- ============================================================
DO $$
BEGIN
    BEGIN
        INSERT INTO Trecho (tipo_trecho, distancia_km, codigo_IATA_origem,
                            codigo_IATA_destino, num_voo)
        VALUES ('Direto', 500.00, 'GRU', 'GRU', 'LA3045');
        RAISE NOTICE 'ERRO: INSERT deveria ter falhado!';
    EXCEPTION WHEN check_violation THEN
        RAISE NOTICE 'OK: Restrição ck_origem_diferente_destino funcionou corretamente. Mensagem: %', SQLERRM;
    END;
END;
$$;

-- Testa UNIQUE constraint: mesmo (num_voo, id_passagem) em Controle_Embarque
DO $$
BEGIN
    BEGIN
        INSERT INTO Controle_Embarque
            (data_hora_passagem_gate, status_presenca_passageiro, status_autorizacao, num_voo, id_passagem)
        VALUES
            ('2026-06-15 08:00:00', 'Presente', 'Autorizado', 'LA3045', 1);
        RAISE NOTICE 'ERRO: INSERT duplicado deveria ter falhado!';
    EXCEPTION WHEN unique_violation THEN
        RAISE NOTICE 'OK: Restrição uq_voo_passagem funcionou. Mensagem: %', SQLERRM;
    END;
END;
$$;

-- ============================================================
-- T8. FUNCIONAMENTO DO GATILHO trg_valida_habilitacao_piloto
-- Tenta inserir piloto com habilitação vencida. Deve falhar.
-- ============================================================
DO $$
BEGIN
    -- Primeiro, insere o funcionário base
    INSERT INTO Comissao_De_Bordo (cpf, nome_completo, data_admissao, salario_base)
    VALUES ('11111111111', 'Piloto Vencido Teste', '2020-01-01', 15000.00);

    BEGIN
        INSERT INTO Piloto (id_funcionario, licenca_piloto, validade_habilitacao)
        VALUES (
            (SELECT id_funcionario FROM Comissao_De_Bordo WHERE cpf = '11111111111'),
            'ANAC-P-VENCIDO',
            '2020-01-01'  -- data no passado
        );
        RAISE NOTICE 'ERRO: INSERT deveria ter falhado por habilitação vencida!';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'OK: Gatilho trg_valida_habilitacao_piloto funcionou. Mensagem: %', SQLERRM;
    END;

    -- Limpa o funcionário de teste
    DELETE FROM Comissao_De_Bordo WHERE cpf = '11111111111';
END;
$$;

-- ============================================================
-- T9. FUNCIONAMENTO DO GATILHO trg_log_cancelamento_voo
-- Cancela o voo LA3320 e verifica se a data de cancelamento
-- foi preenchida automaticamente.
-- ============================================================
-- Estado antes do cancelamento
SELECT num_voo, status_voo, data_hora_efetiva_cancelamento
FROM Voo WHERE num_voo = 'LA3320';

-- Cancela o voo
UPDATE Voo
SET status_voo = 'Cancelado'
WHERE num_voo = 'LA3320';

-- Estado após — data_hora_efetiva_cancelamento deve ser preenchida automaticamente
SELECT num_voo, status_voo, data_hora_efetiva_cancelamento
FROM Voo WHERE num_voo = 'LA3320';

-- ============================================================
-- T10. TRANSAÇÃO EXPLÍCITA com BEGIN / COMMIT / ROLLBACK
-- Cenário: Nova reserva com passagem e vínculo ao voo.
-- Usa ROLLBACK para demonstrar atomicidade.
-- ============================================================

-- --- PARTE A: transação bem-sucedida (COMMIT) ---
BEGIN;

    INSERT INTO Reserva (codigo_localizador, data_criacao, status_pagamento, valor_total)
    VALUES ('RES-TX-001', CURRENT_DATE, 'Pendente', 1500.00);

    INSERT INTO Passagem (classe_cabine, assento_passageiro, id_passageiro, codigo_localizador,
                          bagagem_despachada, peso_bagagem)
    VALUES ('Econômica', '35F', 1, 'RES-TX-001', FALSE, NULL);

    INSERT INTO Destinado_A (id_passagem, num_voo)
    VALUES (
        (SELECT id_passagem FROM Passagem WHERE codigo_localizador = 'RES-TX-001'),
        'LA8020'
    );

COMMIT;

-- Verifica inserção
SELECT r.codigo_localizador, r.valor_total, p.classe_cabine, p.assento_passageiro, da.num_voo
FROM Reserva r
JOIN Passagem p    ON p.codigo_localizador = r.codigo_localizador
JOIN Destinado_A da ON da.id_passagem = p.id_passagem
WHERE r.codigo_localizador = 'RES-TX-001';

-- --- PARTE B: transação revertida (ROLLBACK) ---
BEGIN;

    INSERT INTO Reserva (codigo_localizador, data_criacao, status_pagamento, valor_total)
    VALUES ('RES-TX-002', CURRENT_DATE, 'Pendente', 999.00);

    -- Operação intencionalmente incorreta para demonstrar rollback
    ROLLBACK;

-- Confirma que RES-TX-002 NÃO foi inserida
SELECT COUNT(*) AS deve_ser_zero
FROM Reserva WHERE codigo_localizador = 'RES-TX-002';

-- ============================================================
-- T11. USO DA VIEW vw_ocupacao_por_classe
-- Exibe receita e ticket médio por classe de cabine em cada voo.
-- ============================================================
SELECT *
FROM vw_ocupacao_por_classe
ORDER BY num_voo, classe_cabine;

-- ============================================================
-- T12. CONSULTA EXTRA — Funcionários e idiomas com JOIN
-- Lista todos os funcionários, suas especializações e idiomas.
-- ============================================================
SELECT
    cb.id_funcionario,
    cb.nome_completo,
    CASE
        WHEN pi.id_funcionario IS NOT NULL THEN 'Piloto'
        WHEN co.id_funcionario IS NOT NULL THEN 'Comissário'
        ELSE 'Sem especialização'
    END AS especializacao,
    i.nome             AS idioma,
    fi.nivel_fluencia
FROM Comissao_De_Bordo cb
LEFT JOIN Piloto p2             ON p2.id_funcionario = cb.id_funcionario
LEFT JOIN Piloto pi             ON pi.id_funcionario = cb.id_funcionario
LEFT JOIN Comissario co         ON co.id_funcionario = cb.id_funcionario
LEFT JOIN Funcionario_Idioma fi ON fi.id_funcionario = cb.id_funcionario
LEFT JOIN Idioma i              ON i.cod_idioma = fi.cod_idioma
ORDER BY cb.id_funcionario, i.nome;
