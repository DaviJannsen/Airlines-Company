package com.airlines.company.database.repository;

import com.airlines.company.database.model.ComissaoDeBordo;
import com.airlines.company.dto.projection.ComissaoProjection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface IComissaoDeBordoRepository extends JpaRepository<ComissaoDeBordo, Integer> {

    Optional<ComissaoDeBordo> findByCpf(String cpf);

    boolean existsByCpf(String cpf);

    @Query(
        value = """
            SELECT
                c.id_funcionario         AS idFuncionario,
                c.nome_completo          AS nomeCompleto,
                c.cpf                    AS cpf,
                c.data_admissao          AS dataAdmissao,
                c.salario_base           AS salarioBase,
                CASE WHEN p.id_funcionario IS NOT NULL THEN 'Piloto' ELSE 'Comissário' END AS cargo,
                p.licenca_piloto         AS licencaPiloto,
                CASE
                    WHEN p.id_funcionario IS NOT NULL THEN p.validade_habilitacao::TEXT
                    ELSE com.validade_certificado::TEXT
                END                      AS validadeCertificado,
                CASE WHEN :numVoo IS NOT NULL AND et.id_funcionario IS NOT NULL THEN TRUE ELSE FALSE END AS escaladoNesteVoo,
                (
                    SELECT COUNT(*) FROM airline.escala_trabalho et2
                    WHERE et2.id_funcionario = c.id_funcionario
                )                        AS totalVoos,
                (
                    SELECT json_agg(
                        json_build_object('cod_idioma', fi.cod_idioma, 'nome', i.nome, 'nivel_fluencia', fi.nivel_fluencia)
                        ORDER BY i.nome
                    )
                    FROM airline.funcionario_idioma fi
                    JOIN airline.idioma i ON i.cod_idioma = fi.cod_idioma
                    WHERE fi.id_funcionario = c.id_funcionario
                )::TEXT                  AS idiomasJson
            FROM airline.comissao_de_bordo c
            LEFT JOIN airline.piloto p        ON p.id_funcionario = c.id_funcionario
            LEFT JOIN airline.comissario com  ON com.id_funcionario = c.id_funcionario
            LEFT JOIN airline.escala_trabalho et
                ON et.id_funcionario = c.id_funcionario AND et.num_voo = :numVoo
            WHERE (:busca IS NULL OR c.nome_completo ILIKE CONCAT('%', :busca, '%') OR c.cpf ILIKE CONCAT('%', :busca, '%'))
            ORDER BY CASE WHEN p.id_funcionario IS NOT NULL THEN 0 ELSE 1 END, c.nome_completo ASC
            """,
        nativeQuery = true
    )
    List<ComissaoProjection> listarComissao(@Param("numVoo") String numVoo, @Param("busca") String busca);
}
