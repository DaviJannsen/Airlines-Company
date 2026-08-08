package com.airlines.company.database.repository;

import com.airlines.company.database.model.Voo;
import com.airlines.company.dto.projection.PainelVooProjection;
import com.airlines.company.dto.projection.ReceitaClasseProjection;
import com.airlines.company.dto.projection.VooDetalheProjection;
import com.airlines.company.dto.projection.VooResumoProjection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface IVooRepository extends JpaRepository<Voo, String> {

    @Query(
        value = """
            SELECT num_voo FROM airline.voo
            WHERE cod_aeronave = :codAeronave AND data_partida = :dataPartida
              AND status_voo NOT IN ('Cancelado', 'Concluído')
            LIMIT 1
            """,
        nativeQuery = true
    )
    Optional<String> findConflitoAlocacaoAeronave(@Param("codAeronave") String codAeronave,
                                                   @Param("dataPartida") LocalDate dataPartida);

    @Query(
        value = """
            SELECT
                v.num_voo                                          AS numVoo,
                v.tipo_voo                                         AS tipoVoo,
                v.data_partida                                     AS dataPartida,
                v.hora_partida                                     AS horaPartida,
                v.previsao_chegada                                 AS previsaoChegada,
                v.status_voo                                       AS statusVoo,
                v.cod_aeronave                                     AS codAeronave,
                t.codigo_iata_origem                               AS iataOrigem,
                a_orig.nome_aeroporto                              AS aeroportoOrigem,
                c_orig.nome_cidade                                 AS cidadeOrigem,
                c_orig.pais                                        AS paisOrigem,
                t.codigo_iata_destino                              AS iataDestino,
                a_dest.nome_aeroporto                              AS aeroportoDestino,
                c_dest.nome_cidade                                 AS cidadeDestino,
                c_dest.pais                                        AS paisDestino,
                t.distancia_km                                     AS distanciaKm,
                t.tipo_trecho                                      AS tipoTrecho,
                ma.capacidade                                      AS capacidadeTotal,
                COUNT(DISTINCT da.id_passagem)                     AS passagensEmitidas,
                (ma.capacidade - COUNT(DISTINCT da.id_passagem))   AS assentosRestantes,
                v.data_hora_efetiva_cancelamento::TEXT             AS dataHoraCancelamento,
                (
                    SELECT COUNT(DISTINCT da2.id_passagem)
                    FROM airline.destinado_a da2
                    LEFT JOIN airline.controle_embarque ce2
                        ON ce2.id_passagem = da2.id_passagem AND ce2.num_voo = da2.num_voo
                    WHERE da2.num_voo = v.num_voo
                      AND (ce2.status_autorizacao IS DISTINCT FROM 'Negado')
                )                                                  AS passagensEmbarcadas
            FROM airline.voo v
            INNER JOIN airline.trecho t          ON t.num_voo = v.num_voo
            INNER JOIN airline.aeroporto a_orig  ON a_orig.codigo_iata = t.codigo_iata_origem
            INNER JOIN airline.cidade c_orig     ON c_orig.id_cidade = a_orig.id_cidade
            INNER JOIN airline.aeroporto a_dest  ON a_dest.codigo_iata = t.codigo_iata_destino
            INNER JOIN airline.cidade c_dest     ON c_dest.id_cidade = a_dest.id_cidade
            INNER JOIN airline.aeronave aer      ON aer.cod_aeronave = v.cod_aeronave
            INNER JOIN airline.modelo_aeronave ma ON ma.modelo = aer.modelo
            LEFT  JOIN airline.destinado_a da    ON da.num_voo = v.num_voo
            WHERE (:origem IS NULL OR t.codigo_iata_origem = :origem)
              AND (:destino IS NULL OR t.codigo_iata_destino = :destino)
              AND (:data IS NULL OR v.data_partida = :data)
              AND (:tipoVoo IS NULL OR v.tipo_voo = :tipoVoo)
              AND (:busca IS NULL OR v.num_voo ILIKE CONCAT('%', :busca, '%'))
            GROUP BY
                v.num_voo, v.tipo_voo, v.data_partida, v.hora_partida, v.previsao_chegada,
                v.status_voo, v.cod_aeronave, v.data_hora_efetiva_cancelamento,
                t.codigo_iata_origem, a_orig.nome_aeroporto, c_orig.nome_cidade, c_orig.pais,
                t.codigo_iata_destino, a_dest.nome_aeroporto, c_dest.nome_cidade, c_dest.pais,
                t.distancia_km, t.tipo_trecho, ma.capacidade
            ORDER BY v.data_partida ASC, v.hora_partida ASC
            """,
        nativeQuery = true
    )
    List<VooResumoProjection> listarComFiltros(@Param("origem") String origem,
                                                @Param("destino") String destino,
                                                @Param("data") LocalDate data,
                                                @Param("tipoVoo") String tipoVoo,
                                                @Param("busca") String busca);

    @Query(
        value = """
            SELECT
                v.num_voo                                     AS numVoo,
                v.tipo_voo                                    AS tipoVoo,
                v.data_partida                                AS dataPartida,
                v.hora_partida                                AS horaPartida,
                v.previsao_chegada                            AS previsaoChegada,
                v.status_voo                                  AS statusVoo,
                v.motivo_atraso_cancelamento                  AS motivoAtrasoCancelamento,
                v.data_hora_efetiva_cancelamento::TEXT        AS dataHoraCancelamento,
                a.cod_aeronave                                AS codAeronave,
                ma.modelo                                     AS modelo,
                ma.fabricante                                 AS fabricante,
                ma.capacidade                                 AS capacidade
            FROM airline.voo v
            INNER JOIN airline.aeronave a        ON a.cod_aeronave = v.cod_aeronave
            INNER JOIN airline.modelo_aeronave ma ON ma.modelo = a.modelo
            WHERE v.num_voo = :numVoo
            LIMIT 1
            """,
        nativeQuery = true
    )
    Optional<VooDetalheProjection> buscarDetalhePorNumero(@Param("numVoo") String numVoo);

    @Query(
        value = """
            SELECT
                num_voo                AS numVoo,
                tipo_voo               AS tipoVoo,
                data_partida::TEXT     AS dataPartida,
                hora_partida::TEXT     AS horaPartida,
                status_voo             AS statusVoo,
                origem                 AS origem,
                destino                AS destino,
                distancia_km           AS distanciaKm,
                modelo_aeronave        AS modeloAeronave,
                capacidade_maxima      AS capacidadeMaxima,
                passagens_vendidas     AS passagensVendidas,
                tripulacao_escalada    AS tripulacaoEscalada
            FROM airline.vw_painel_voos
            ORDER BY data_partida ASC, hora_partida ASC
            """,
        nativeQuery = true
    )
    List<PainelVooProjection> relatorioPainelVoos();

    @Query(
        value = """
            SELECT
                da.num_voo                            AS numVoo,
                t.codigo_iata_origem                  AS origem,
                t.codigo_iata_destino                 AS destino,
                p.classe_cabine                       AS classeCabine,
                COUNT(p.id_passagem)                  AS qtdPassagens,
                SUM(r.valor_total)::NUMERIC            AS receitaTotal,
                ROUND(AVG(r.valor_total), 2)::NUMERIC AS ticketMedio
            FROM airline.passagem p
            INNER JOIN airline.destinado_a da ON da.id_passagem = p.id_passagem
            INNER JOIN airline.voo v          ON v.num_voo = da.num_voo
            INNER JOIN airline.trecho t       ON t.num_voo = v.num_voo
            INNER JOIN airline.reserva r      ON r.codigo_localizador = p.codigo_localizador
            GROUP BY da.num_voo, t.codigo_iata_origem, t.codigo_iata_destino, p.classe_cabine
            HAVING COUNT(p.id_passagem) >= 1
            ORDER BY receitaTotal DESC, da.num_voo ASC
            """,
        nativeQuery = true
    )
    List<ReceitaClasseProjection> relatorioReceitaPorClasse();
}
