package com.airlines.company.database.repository;

import com.airlines.company.database.model.Trecho;
import com.airlines.company.dto.projection.TrechoDetalheProjection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ITrechoRepository extends JpaRepository<Trecho, Integer> {

    Optional<Trecho> findFirstByVoo_NumVooOrderByCodigoTrechoAsc(String numVoo);

    @Query(
        value = """
            SELECT
                t.codigo_trecho        AS codigoTrecho,
                t.tipo_trecho          AS tipoTrecho,
                t.distancia_km         AS distanciaKm,
                t.codigo_iata_origem   AS codigoIataOrigem,
                a_o.nome_aeroporto     AS aeroportoOrigem,
                c_o.nome_cidade        AS cidadeOrigem,
                t.codigo_iata_destino  AS codigoIataDestino,
                a_d.nome_aeroporto     AS aeroportoDestino,
                c_d.nome_cidade        AS cidadeDestino
            FROM airline.trecho t
            INNER JOIN airline.aeroporto a_o ON a_o.codigo_iata = t.codigo_iata_origem
            INNER JOIN airline.cidade c_o    ON c_o.id_cidade = a_o.id_cidade
            INNER JOIN airline.aeroporto a_d ON a_d.codigo_iata = t.codigo_iata_destino
            INNER JOIN airline.cidade c_d    ON c_d.id_cidade = a_d.id_cidade
            WHERE t.num_voo = :numVoo
            ORDER BY t.codigo_trecho
            """,
        nativeQuery = true
    )
    List<TrechoDetalheProjection> buscarDetalhesPorVoo(@Param("numVoo") String numVoo);
}
