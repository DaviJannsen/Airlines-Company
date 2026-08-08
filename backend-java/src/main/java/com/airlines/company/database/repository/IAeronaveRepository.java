package com.airlines.company.database.repository;

import com.airlines.company.database.model.Aeronave;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface IAeronaveRepository extends JpaRepository<Aeronave, String> {

    List<Aeronave> findAllByOrderByCodAeronaveAsc();

    @Query(
        value = """
            SELECT
                a.cod_aeronave           AS codAeronave,
                a.modelo                 AS modelo,
                ma.fabricante            AS fabricante,
                ma.capacidade            AS capacidade,
                a.aviso_manutencao       AS avisoManutencao,
                a.data_ultima_manutencao AS dataUltimaManutencao
            FROM airline.aeronave a
            INNER JOIN airline.modelo_aeronave ma ON ma.modelo = a.modelo
            ORDER BY a.cod_aeronave ASC
            """,
        nativeQuery = true
    )
    List<com.airlines.company.dto.projection.AeronaveResumoProjection> listarComModelo();
}
