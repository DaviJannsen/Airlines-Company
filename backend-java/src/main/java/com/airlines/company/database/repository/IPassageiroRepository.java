package com.airlines.company.database.repository;

import com.airlines.company.database.model.Passageiro;
import com.airlines.company.dto.projection.PassageiroResumoProjection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface IPassageiroRepository extends JpaRepository<Passageiro, Integer> {

    Optional<Passageiro> findByDocumentoIdentidade(String documentoIdentidade);

    boolean existsByDocumentoIdentidade(String documentoIdentidade);

    @Query(
        value = """
            SELECT
                p.id_passageiro          AS idPassageiro,
                p.nome_completo          AS nomeCompleto,
                p.data_nascimento        AS dataNascimento,
                p.documento_identidade   AS documentoIdentidade,
                p.necessidades_especiais AS necessidadesEspeciais,
                p.contato_emergencia     AS contatoEmergencia,
                COUNT(pa.id_passagem)    AS totalPassagens
            FROM airline.passageiro p
            LEFT JOIN airline.passagem pa ON pa.id_passageiro = p.id_passageiro
            WHERE (:busca IS NULL OR p.nome_completo ILIKE CONCAT('%', :busca, '%') OR p.documento_identidade ILIKE CONCAT('%', :busca, '%'))
            GROUP BY p.id_passageiro, p.nome_completo, p.data_nascimento, p.documento_identidade, p.necessidades_especiais, p.contato_emergencia
            ORDER BY p.nome_completo ASC
            """,
        nativeQuery = true
    )
    List<PassageiroResumoProjection> listarComBusca(@Param("busca") String busca);
}
