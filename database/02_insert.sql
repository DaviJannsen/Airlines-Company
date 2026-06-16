-- ============================================================
-- TP3 — Modelo Físico em PostgreSQL
-- Sistema de Gerenciamento de Companhia Aérea
-- Equipe 1: Camila Pinheiro, Davi Jannsen, David Moreira, Apolo Victor
-- Arquivo: 02_insert.sql
-- ============================================================

SET search_path = airline;

-- ------------------------------------------------------------
-- 1. CIDADES  (id explícito para idempotência)
-- ------------------------------------------------------------
INSERT INTO Cidade (id_cidade, nome_cidade, pais, clima_predominante, idioma_local) VALUES
(1,  'São Paulo',      'Brasil',         'Subtropical',    'pt-BR'),
(2,  'Fortaleza',      'Brasil',         'Semiárido',      'pt-BR'),
(3,  'Rio de Janeiro', 'Brasil',         'Tropical',       'pt-BR'),
(4,  'Recife',         'Brasil',         'Tropical',       'pt-BR'),
(5,  'Manaus',         'Brasil',         'Equatorial',     'pt-BR'),
(6,  'Miami',          'Estados Unidos', 'Subtropical',    'en-US'),
(7,  'Paris',          'França',         'Oceânico',       'fr-FR'),
(8,  'Lisboa',         'Portugal',       'Mediterrâneo',   'pt-PT'),
(9,  'Buenos Aires',   'Argentina',      'Subtropical',    'es-AR'),
(10, 'Bogotá',         'Colômbia',       'Tropical',       'es-CO')
ON CONFLICT (id_cidade) DO NOTHING;

SELECT setval('airline.cidade_id_cidade_seq', 10);

-- ------------------------------------------------------------
-- 2. AEROPORTOS
-- ------------------------------------------------------------
INSERT INTO Aeroporto (codigo_IATA, nome_aeroporto, capacidade_pistas, id_cidade, altitude_pista_pes, site_aeroporto) VALUES
('GRU', 'Aeroporto Internacional de Guarulhos',        4,  1, 2459, 'https://www.gru.com.br'),
('FOR', 'Aeroporto Internacional Pinto Martins',        2,  2,   82, 'https://www.for.infraero.gov.br'),
('GIG', 'Aeroporto Internacional do Galeão',            3,  3,   28, 'https://www.riogaleao.com'),
('REC', 'Aeroporto Internacional dos Guararapes',       2,  4,   33, 'https://www.rec.infraero.gov.br'),
('MAO', 'Aeroporto Internacional Eduardo Gomes',        2,  5,  264, NULL),
('MIA', 'Miami International Airport',                  4,  6,    8, 'https://www.miami-airport.com'),
('CDG', 'Aéroport Paris-Charles de Gaulle',             5,  7,  392, 'https://www.parisaeroport.fr'),
('LIS', 'Aeroporto Humberto Delgado',                   2,  8,  374, 'https://www.ana.pt'),
('EZE', 'Aeropuerto Internacional Ministro Pistarini',  2,  9,   67, 'https://www.aa2000.com.ar'),
('BOG', 'Aeropuerto Internacional El Dorado',           2, 10, 8361, NULL)
ON CONFLICT (codigo_IATA) DO NOTHING;

-- ------------------------------------------------------------
-- 3. MODELOS DE AERONAVE
-- ------------------------------------------------------------
INSERT INTO Modelo_Aeronave (modelo, fabricante, capacidade, kms_rodados, preco) VALUES
('Boeing 737-800',     'Boeing',  189, 45000,  85000000.00),
('Airbus A320neo',     'Airbus',  180, 30000,  90000000.00),
('Boeing 777-300ER',   'Boeing',  396, 20000, 320000000.00),
('Airbus A330-200',    'Airbus',  247, 15000, 220000000.00),
('Embraer E195-E2',    'Embraer', 146,  8000,  65000000.00)
ON CONFLICT (modelo) DO NOTHING;

-- ------------------------------------------------------------
-- 4. AERONAVES
-- ------------------------------------------------------------
INSERT INTO Aeronave (cod_aeronave, modelo, aviso_manutencao, data_ultima_manutencao) VALUES
('PR-GUA', 'Boeing 737-800',   FALSE, '2025-11-10'),
('PR-FOR', 'Airbus A320neo',   FALSE, '2025-12-01'),
('PR-RIO', 'Boeing 777-300ER', FALSE, '2026-01-15'),
('PR-REC', 'Airbus A330-200',  TRUE,  '2025-09-20'),
('PR-MAO', 'Embraer E195-E2',  FALSE, '2026-02-28'),
('PR-MIA', 'Boeing 737-800',   FALSE, '2026-03-05'),
('PR-CDG', 'Airbus A330-200',  FALSE, '2026-04-10'),
('PR-EZE', 'Boeing 737-800',   FALSE, '2026-05-01')
ON CONFLICT (cod_aeronave) DO NOTHING;

-- ------------------------------------------------------------
-- 5. VOOS
-- ------------------------------------------------------------
INSERT INTO Voo (num_voo, tipo_voo, data_partida, status_voo, hora_partida, previsao_chegada, cod_aeronave) VALUES
('LA3045', 'Nacional',        '2026-06-15', 'Programado', '08:00', '2026-06-15 10:30:00', 'PR-GUA'),
('LA3210', 'Nacional',        '2026-06-15', 'Programado', '14:00', '2026-06-15 16:20:00', 'PR-FOR'),
('LA3320', 'Nacional',        '2026-06-16', 'Programado', '07:00', '2026-06-16 09:00:00', 'PR-MAO'),
('LA8010', 'Internacional',   '2026-06-17', 'Programado', '23:00', '2026-06-18 09:30:00', 'PR-RIO'),
('LA8020', 'Internacional',   '2026-06-18', 'Programado', '11:00', '2026-06-18 20:45:00', 'PR-CDG'),
('LA8030', 'Internacional',   '2026-06-20', 'Programado', '19:00', '2026-06-21 05:00:00', 'PR-REC'),
('LA3500', 'Nacional',        '2026-06-10', 'Concluído',  '06:00', '2026-06-10 08:15:00', 'PR-MIA'),
('LA3501', 'Nacional',        '2026-06-11', 'Cancelado',  '10:00', '2026-06-11 12:10:00', 'PR-EZE')
ON CONFLICT (num_voo) DO NOTHING;

-- Voo cancelado: registrar data de cancelamento e motivo
UPDATE Voo
SET data_hora_efetiva_cancelamento = '2026-06-11 07:00:00',
    motivo_atraso_cancelamento = 'Condições meteorológicas adversas na rota'
WHERE num_voo = 'LA3501'
  AND data_hora_efetiva_cancelamento IS NULL;

-- ------------------------------------------------------------
-- 6. TRECHOS  (id explícito para idempotência)
-- ------------------------------------------------------------
INSERT INTO Trecho (codigo_trecho, tipo_trecho, distancia_km, codigo_IATA_origem, codigo_IATA_destino, num_voo, status_sazonalidade, via_aerea_regulamentada) VALUES
(1, 'Direto',       2368.00, 'GRU', 'FOR', 'LA3045', 'Normal',      TRUE),
(2, 'Direto',       2368.00, 'FOR', 'GRU', 'LA3210', 'Normal',      TRUE),
(3, 'Direto',       2691.00, 'GRU', 'MAO', 'LA3320', 'Normal',      TRUE),
(4, 'Direto',       9461.00, 'GRU', 'MIA', 'LA8010', 'Normal',      TRUE),
(5, 'Direto',       9218.00, 'GRU', 'CDG', 'LA8020', 'Conturbado',  TRUE),
(6, 'Com Escala',   7340.00, 'GRU', 'EZE', 'LA8030', 'Normal',      TRUE),
(7, 'Direto',       1655.00, 'GRU', 'FOR', 'LA3500', 'Normal',      TRUE),
(8, 'Direto',       1290.00, 'REC', 'GRU', 'LA3501', 'Normal',      TRUE)
ON CONFLICT (codigo_trecho) DO NOTHING;

SELECT setval(pg_get_serial_sequence('trecho', 'codigo_trecho'), 8);

-- ------------------------------------------------------------
-- 7. COMISSAO DE BORDO (id explícito para idempotência)
-- ------------------------------------------------------------
INSERT INTO Comissao_De_Bordo (id_funcionario, cpf, nome_completo, data_admissao, salario_base) VALUES
(1,  '12345678901', 'Carlos Eduardo Mota',      '2015-03-10', 18000.00),  -- Piloto
(2,  '23456789012', 'Fernanda Lima Souza',      '2017-07-01', 18500.00),  -- Piloto
(3,  '34567890123', 'Rafael Batista Nunes',     '2016-11-20', 16000.00),  -- Piloto
(4,  '45678901234', 'Juliana Martins Costa',    '2019-04-15',  8500.00),  -- Comissária
(5,  '56789012345', 'Lucas Pereira Alves',      '2020-09-05',  8200.00),  -- Comissário
(6,  '67890123456', 'Amanda Torres Leal',       '2018-01-22',  8800.00),  -- Comissária
(7,  '78901234567', 'Bruno Rodrigues Silva',    '2021-06-30',  8100.00),  -- Comissário
(8,  '89012345678', 'Patrícia Nascimento Lima', '2014-08-12',  9000.00),  -- Comissária
(9,  '90123456789', 'Marcos Vinícius Araujo',   '2022-02-14',  8300.00),  -- Comissário
(10, '01234567890', 'Cláudia Regina Ferreira',  '2013-05-03', 19000.00)   -- Piloto
ON CONFLICT (cpf) DO NOTHING;

SELECT setval(pg_get_serial_sequence('comissao_de_bordo', 'id_funcionario'), 10);

-- ------------------------------------------------------------
-- 8. PILOTOS (subclasse)
-- ------------------------------------------------------------
INSERT INTO Piloto (id_funcionario, licenca_piloto, validade_habilitacao) VALUES
(1, 'ANAC-P-001234', '2027-12-31'),
(2, 'ANAC-P-005678', '2028-06-30'),
(3, 'ANAC-P-009012', '2026-11-30'),
(10,'ANAC-P-003456', '2029-03-15')
ON CONFLICT (id_funcionario) DO NOTHING;

-- ------------------------------------------------------------
-- 9. COMISSÁRIOS (subclasse)
-- ------------------------------------------------------------
INSERT INTO Comissario (id_funcionario, validade_certificado) VALUES
(4, '2027-04-15'),
(5, '2026-09-05'),
(6, '2028-01-22'),
(7, '2027-06-30'),
(8, '2026-08-12'),
(9, '2027-02-14')
ON CONFLICT (id_funcionario) DO NOTHING;

-- ------------------------------------------------------------
-- 10. IDIOMAS
-- ------------------------------------------------------------
INSERT INTO Idioma (nome)
SELECT nome FROM (VALUES ('Português'), ('Inglês'), ('Espanhol'), ('Francês'), ('Alemão')) t(nome)
WHERE NOT EXISTS (SELECT 1 FROM airline.Idioma LIMIT 1);

-- ------------------------------------------------------------
-- 11. FUNCIONARIO_IDIOMA
-- ------------------------------------------------------------
INSERT INTO Funcionario_Idioma (id_funcionario, cod_idioma, nivel_fluencia, instituicao_certificado) VALUES
(1, 1, 'Nativo',        NULL),
(1, 2, 'Avançado',      'ICAO Language Proficiency'),
(2, 1, 'Nativo',        NULL),
(2, 2, 'Avançado',      'ICAO Language Proficiency'),
(2, 3, 'Intermediário', 'Instituto Cervantes'),
(3, 1, 'Nativo',        NULL),
(3, 2, 'Avançado',      'ICAO Language Proficiency'),
(4, 1, 'Nativo',        NULL),
(4, 2, 'Intermediário', NULL),
(5, 1, 'Nativo',        NULL),
(6, 1, 'Nativo',        NULL),
(6, 4, 'Básico',        'Alliance Française'),
(10,1, 'Nativo',        NULL),
(10,2, 'Avançado',      'ICAO Language Proficiency')
ON CONFLICT (id_funcionario, cod_idioma) DO NOTHING;

-- ------------------------------------------------------------
-- 12. ESCALAS DE TRABALHO
-- ------------------------------------------------------------
INSERT INTO Escala_Trabalho (id_funcionario, num_voo, codigo_IATA) VALUES
(1,  'LA3045', 'GRU'),
(4,  'LA3045', 'GRU'),
(5,  'LA3045', 'GRU'),
(2,  'LA3210', 'FOR'),
(6,  'LA3210', 'FOR'),
(3,  'LA3320', 'GRU'),
(7,  'LA3320', 'GRU'),
(10, 'LA8010', 'GRU'),
(4,  'LA8010', 'GRU'),
(6,  'LA8010', 'GRU'),
(8,  'LA8010', 'GRU'),
(1,  'LA8020', 'GRU'),
(2,  'LA8020', 'GRU'),
(9,  'LA8020', 'GRU'),
(3,  'LA8030', 'GRU'),
(5,  'LA8030', 'GRU')
ON CONFLICT (id_funcionario, num_voo, codigo_IATA) DO NOTHING;

-- ------------------------------------------------------------
-- 13. PASSAGEIROS  (id explícito para idempotência)
-- ------------------------------------------------------------
INSERT INTO Passageiro (id_passageiro, nome_completo, data_nascimento, nacionalidade, documento_identidade, contato_emergencia, necessidades_especiais) VALUES
(1,  'Ana Carolina Ferreira',    '1990-05-14', 'Brasileira',    'CPF-11122233344', '85999001122', FALSE),
(2,  'João Victor Oliveira',     '1985-11-30', 'Brasileira',    'CPF-22233344455', '85999003344', FALSE),
(3,  'Mariana Beatriz Santos',   '1995-03-22', 'Brasileira',    'CPF-33344455566', '85988001122', TRUE),
(4,  'Pedro Henrique Costa',     '1978-08-01', 'Brasileira',    'CPF-44455566677', NULL,          FALSE),
(5,  'Luciana Prado Mendes',     '2001-12-10', 'Brasileira',    'CPF-55566677788', '11977001122', FALSE),
(6,  'Robert Johnson',           '1970-07-04', 'Americana',     'PASSPORT-US001',  NULL,          FALSE),
(7,  'Sophie Leclerc',           '1988-02-19', 'Francesa',      'PASSPORT-FR001',  NULL,          FALSE),
(8,  'Carlos Gutiérrez',         '1982-09-09', 'Argentina',     'DNI-AR001234',    NULL,          FALSE),
(9,  'Beatriz Alves Lima',       '1993-06-25', 'Brasileira',    'CPF-66677788899', '11988003344', FALSE),
(10, 'Felipe Martins Borges',    '2000-01-17', 'Brasileira',    'CPF-77788899900', '21977001122', TRUE),
(11, 'Carla Mendonça Pires',     '1975-04-03', 'Brasileira',    'CPF-88899900011', NULL,          FALSE),
(12, 'Gustavo Henrique Ribeiro', '1998-10-21', 'Brasileira',    'CPF-99900011122', '85988004455', FALSE)
ON CONFLICT (documento_identidade) DO NOTHING;

SELECT setval(pg_get_serial_sequence('passageiro', 'id_passageiro'), 12);

-- ------------------------------------------------------------
-- 14. RESERVAS
-- ------------------------------------------------------------
INSERT INTO Reserva (codigo_localizador, data_criacao, status_pagamento, valor_total, agencia_parceira, cupom_desconto) VALUES
('RES-GRU-001', '2026-05-10', 'Pago',       850.00,  FALSE, FALSE),
('RES-GRU-002', '2026-05-11', 'Pago',      1200.00,  FALSE, TRUE),
('RES-GRU-003', '2026-05-12', 'Pago',      3500.00,  TRUE,  FALSE),
('RES-GRU-004', '2026-05-15', 'Pendente',  2800.00,  FALSE, FALSE),
('RES-GRU-005', '2026-05-18', 'Pago',       650.00,  FALSE, FALSE),
('RES-GRU-006', '2026-05-20', 'Pago',      1800.00,  TRUE,  TRUE),
('RES-GRU-007', '2026-05-22', 'Pago',      9200.00,  FALSE, FALSE),
('RES-GRU-008', '2026-05-25', 'Cancelado', 1100.00,  FALSE, FALSE),
('RES-GRU-009', '2026-06-01', 'Pago',       720.00,  FALSE, FALSE),
('RES-GRU-010', '2026-06-02', 'Pago',      4300.00,  TRUE,  FALSE)
ON CONFLICT (codigo_localizador) DO NOTHING;

-- ------------------------------------------------------------
-- 15. PASSAGENS  (id explícito para idempotência)
-- ------------------------------------------------------------
INSERT INTO Passagem (id_passagem, classe_cabine, assento_passageiro, id_passageiro, codigo_localizador, bagagem_despachada, peso_bagagem) VALUES
(1,  'Econômica',      '22A', 1,  'RES-GRU-001', TRUE,  23.00),
(2,  'Econômica',      '22B', 2,  'RES-GRU-001', FALSE, NULL),
(3,  'Econômica',      '15C', 3,  'RES-GRU-002', TRUE,  20.50),
(4,  'Executiva',      '3A',  4,  'RES-GRU-003', TRUE,  32.00),
(5,  'Econômica',      '30D', 5,  'RES-GRU-004', FALSE, NULL),
(6,  'Econômica',      '10B', 6,  'RES-GRU-005', TRUE,  18.00),
(7,  'Primeira Classe','1A',  7,  'RES-GRU-006', TRUE,  28.00),
(8,  'Executiva',      '5C',  8,  'RES-GRU-007', TRUE,  25.00),
(9,  'Econômica',      '18E', 9,  'RES-GRU-008', FALSE, NULL),
(10, 'Econômica',      '25F', 10, 'RES-GRU-009', TRUE,  15.00),
(11, 'Econômica',      '12A', 11, 'RES-GRU-010', TRUE,  22.00),
(12, 'Executiva',      '4B',  12, 'RES-GRU-010', TRUE,  30.00)
ON CONFLICT (id_passagem) DO NOTHING;

SELECT setval(pg_get_serial_sequence('passagem', 'id_passagem'), 12);

-- ------------------------------------------------------------
-- 16. DESTINADO_A  (passagem vinculada ao voo)
-- ------------------------------------------------------------
INSERT INTO Destinado_A (id_passagem, num_voo) VALUES
(1,  'LA3045'),
(2,  'LA3045'),
(3,  'LA3210'),
(4,  'LA8010'),
(5,  'LA3320'),
(6,  'LA3045'),
(7,  'LA8020'),
(8,  'LA8030'),
(9,  'LA3501'),   -- voo cancelado (testa restrição)
(10, 'LA3045'),
(11, 'LA8010'),
(12, 'LA8010')
ON CONFLICT (id_passagem, num_voo) DO NOTHING;

-- ------------------------------------------------------------
-- 17. CONTROLE DE EMBARQUE
-- ------------------------------------------------------------
INSERT INTO Controle_Embarque (data_hora_passagem_gate, status_presenca_passageiro, status_autorizacao, num_voo, id_passagem, motivo_impedimento_embarque) VALUES
('2026-06-15 07:30:00', 'Presente',  'Autorizado', 'LA3045', 1,  NULL),
('2026-06-15 07:35:00', 'Presente',  'Autorizado', 'LA3045', 2,  NULL),
('2026-06-15 07:40:00', 'Presente',  'Autorizado', 'LA3045', 6,  NULL),
('2026-06-15 07:55:00', 'Ausente',   'Pendente',   'LA3045', 10, NULL),
('2026-06-15 13:50:00', 'Presente',  'Autorizado', 'LA3210', 3,  NULL),
('2026-06-16 06:45:00', 'Presente',  'Autorizado', 'LA3320', 5,  NULL),
('2026-06-17 22:30:00', 'Presente',  'Autorizado', 'LA8010', 4,  NULL),
('2026-06-17 22:40:00', 'Presente',  'Autorizado', 'LA8010', 11, NULL),
('2026-06-17 22:50:00', 'Presente',  'Negado',     'LA8010', 12, 'Documento de viagem vencido')
ON CONFLICT (num_voo, id_passagem) DO NOTHING;
