package com.airlines.company.database.repository;

import com.airlines.company.database.model.ControleEmbarque;
import com.airlines.company.dto.projection.EmbarqueProjection;
import com.airlines.company.dto.projection.ResumoEmbarqueProjection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface IControleEmbarqueRepository extends JpaRepository<ControleEmbarque, Integer> {

    @Query(
        value = """
            SELECT
                ce.id_controle_embarque        AS idControleEmbarque,
                ce.data_hora_passagem_gate     AS dataHoraPassagemGate,
                ce.status_presenca_passageiro  AS statusPresencaPassageiro,
                ce.status_autorizacao          AS statusAutorizacao,
                ce.motivo_impedimento_embarque AS motivoImpedimentoEmbarque,
                ce.num_voo                     AS numVoo,
                ce.id_passagem                 AS idPassagem,
                pa.nome_completo                AS nomePassageiro,
                pa.documento_identidade         AS documentoIdentidade,
                p.classe_cabine                 AS classeCabine,
                p.assento_passageiro             AS assentoPassageiro,
                p.codigo_localizador             AS codigoLocalizador,
                r.status_pagamento                AS statusPagamento,
                r.valor_total::TEXT               AS valorTotal,
                v.data_partida                    AS dataPartida,
                v.hora_partida                    AS horaPartida,
                c_orig.nome_cidade                AS cidadeOrigem,
                c_dest.nome_cidade                AS cidadeDestino
            FROM airline.controle_embarque ce
            INNER JOIN airline.passagem p    ON p.id_passagem = ce.id_passagem
            INNER JOIN airline.reserva r     ON r.codigo_localizador = p.codigo_localizador
            INNER JOIN airline.passageiro pa ON pa.id_passageiro = p.id_passageiro
            INNER JOIN airline.voo v         ON v.num_voo = ce.num_voo
            INNER JOIN LATERAL (
                SELECT codigo_iata_origem, codigo_iata_destino
                FROM airline.trecho
                WHERE num_voo = v.num_voo
                ORDER BY codigo_trecho
                LIMIT 1
            ) t ON TRUE
            INNER JOIN airline.aeroporto ao  ON ao.codigo_iata = t.codigo_iata_origem
            INNER JOIN airline.cidade c_orig ON c_orig.id_cidade = ao.id_cidade
            INNER JOIN airline.aeroporto ad  ON ad.codigo_iata = t.codigo_iata_destino
            INNER JOIN airline.cidade c_dest ON c_dest.id_cidade = ad.id_cidade
            WHERE (:numVoo IS NULL OR ce.num_voo = :numVoo)
            ORDER BY
                CASE ce.status_autorizacao WHEN 'Pendente' THEN 0 WHEN 'Autorizado' THEN 1 ELSE 2 END,
                v.data_partida ASC, v.hora_partida ASC
            """,
        nativeQuery = true
    )
    List<EmbarqueProjection> listarEmbarque(@Param("numVoo") String numVoo);

    @Query(
        value = """
            SELECT
                ce.num_voo                                                                          AS numVoo,
                c_orig.nome_cidade                                                                   AS cidadeOrigem,
                c_dest.nome_cidade                                                                   AS cidadeDestino,
                v.data_partida::TEXT                                                                 AS dataPartida,
                v.hora_partida::TEXT                                                                 AS horaPartida,
                v.status_voo                                                                         AS statusVoo,
                COUNT(ce.id_passagem)                                                                AS totalPassageiros,
                COUNT(ce.id_passagem) FILTER (WHERE ce.status_presenca_passageiro = 'Presente')      AS presentes,
                COUNT(ce.id_passagem) FILTER (WHERE ce.status_autorizacao = 'Pendente')              AS embarquePendente,
                COUNT(p.id_passagem)  FILTER (WHERE r.status_pagamento = 'Pendente')                 AS pagPendente
            FROM airline.controle_embarque ce
            INNER JOIN airline.passagem p    ON p.id_passagem = ce.id_passagem
            INNER JOIN airline.reserva r     ON r.codigo_localizador = p.codigo_localizador
            INNER JOIN airline.voo v         ON v.num_voo = ce.num_voo
            INNER JOIN LATERAL (
                SELECT codigo_iata_origem, codigo_iata_destino
                FROM airline.trecho
                WHERE num_voo = v.num_voo
                ORDER BY codigo_trecho
                LIMIT 1
            ) t ON TRUE
            INNER JOIN airline.aeroporto ao  ON ao.codigo_iata = t.codigo_iata_origem
            INNER JOIN airline.cidade c_orig ON c_orig.id_cidade = ao.id_cidade
            INNER JOIN airline.aeroporto ad  ON ad.codigo_iata = t.codigo_iata_destino
            INNER JOIN airline.cidade c_dest ON c_dest.id_cidade = ad.id_cidade
            GROUP BY
                ce.num_voo, c_orig.nome_cidade, c_dest.nome_cidade,
                v.data_partida, v.hora_partida, v.status_voo
            HAVING
                (:filtro = 'presentes'         AND COUNT(ce.id_passagem) FILTER (WHERE ce.status_presenca_passageiro = 'Presente') > 0)
             OR (:filtro = 'embarque_pendente' AND COUNT(ce.id_passagem) FILTER (WHERE ce.status_autorizacao = 'Pendente') > 0)
             OR (:filtro = 'pag_pendente'      AND COUNT(p.id_passagem)  FILTER (WHERE r.status_pagamento = 'Pendente') > 0)
            ORDER BY totalPassageiros DESC, v.data_partida ASC
            """,
        nativeQuery = true
    )
    List<ResumoEmbarqueProjection> resumoPorVoo(@Param("filtro") String filtro);
}
