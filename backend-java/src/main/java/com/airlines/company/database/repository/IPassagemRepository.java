package com.airlines.company.database.repository;

import com.airlines.company.database.model.Passagem;
import com.airlines.company.dto.projection.PassageiroVooProjection;
import com.airlines.company.dto.projection.ReservaDetalheProjection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface IPassagemRepository extends JpaRepository<Passagem, Integer> {

    @Query(
        value = "SELECT p.assento_passageiro FROM airline.passagem p " +
                "INNER JOIN airline.destinado_a da ON da.id_passagem = p.id_passagem " +
                "WHERE da.num_voo = :numVoo",
        nativeQuery = true
    )
    List<String> buscarAssentosOcupados(@Param("numVoo") String numVoo);

    @Query(
        value = """
            SELECT
                r.codigo_localizador           AS codigoLocalizador,
                r.data_criacao                 AS dataCriacao,
                r.status_pagamento              AS statusPagamento,
                r.valor_total                   AS valorTotal,
                r.agencia_parceira               AS agenciaParceira,
                pa.id_passagem                   AS idPassagem,
                pa.classe_cabine                 AS classeCabine,
                pa.assento_passageiro            AS assentoPassageiro,
                pa.bagagem_despachada            AS bagagemDespachada,
                pa.peso_bagagem                  AS pesoBagagem,
                v.num_voo                        AS numVoo,
                v.tipo_voo                       AS tipoVoo,
                v.data_partida                   AS dataPartida,
                v.hora_partida                   AS horaPartida,
                v.previsao_chegada                AS previsaoChegada,
                v.status_voo                      AS statusVoo,
                c_orig.nome_cidade                AS cidadeOrigem,
                c_dest.nome_cidade                AS cidadeDestino,
                ce.status_presenca_passageiro     AS statusPresencaPassageiro
            FROM airline.passagem pa
            INNER JOIN airline.reserva r          ON r.codigo_localizador = pa.codigo_localizador
            INNER JOIN airline.destinado_a da     ON da.id_passagem = pa.id_passagem
            INNER JOIN airline.voo v              ON v.num_voo = da.num_voo
            INNER JOIN airline.trecho t            ON t.num_voo = v.num_voo
            INNER JOIN airline.aeroporto a_orig   ON a_orig.codigo_iata = t.codigo_iata_origem
            INNER JOIN airline.cidade c_orig      ON c_orig.id_cidade = a_orig.id_cidade
            INNER JOIN airline.aeroporto a_dest   ON a_dest.codigo_iata = t.codigo_iata_destino
            INNER JOIN airline.cidade c_dest      ON c_dest.id_cidade = a_dest.id_cidade
            LEFT JOIN airline.controle_embarque ce ON ce.id_passagem = pa.id_passagem AND ce.num_voo = v.num_voo
            WHERE pa.id_passageiro = :idPassageiro
            ORDER BY v.data_partida DESC, v.hora_partida DESC
            """,
        nativeQuery = true
    )
    List<ReservaDetalheProjection> listarReservasDoPassageiro(@Param("idPassageiro") Integer idPassageiro);

    @Query(
        value = """
            SELECT
                pa.id_passageiro          AS idPassageiro,
                pa.nome_completo          AS nomeCompleto,
                pa.documento_identidade   AS documentoIdentidade,
                p.id_passagem             AS idPassagem,
                p.assento_passageiro      AS assentoPassageiro,
                p.classe_cabine           AS classeCabine,
                p.bagagem_despachada      AS bagagemDespachada,
                r.codigo_localizador      AS codigoLocalizador,
                r.status_pagamento        AS statusPagamento,
                r.valor_total             AS valorTotal,
                ce.status_autorizacao            AS statusAutorizacao,
                ce.status_presenca_passageiro    AS statusPresencaPassageiro
            FROM airline.destinado_a da
            INNER JOIN airline.passagem p    ON p.id_passagem = da.id_passagem
            INNER JOIN airline.passageiro pa ON pa.id_passageiro = p.id_passageiro
            INNER JOIN airline.reserva r     ON r.codigo_localizador = p.codigo_localizador
            LEFT JOIN airline.controle_embarque ce
                ON ce.id_passagem = p.id_passagem AND ce.num_voo = da.num_voo
            WHERE da.num_voo = :numVoo
            ORDER BY p.assento_passageiro ASC
            """,
        nativeQuery = true
    )
    List<PassageiroVooProjection> listarPassageirosDoVoo(@Param("numVoo") String numVoo);
}
