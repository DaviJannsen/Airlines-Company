package com.airlines.company.dto.response;

import com.airlines.company.dto.projection.TrechoDetalheProjection;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

public record VooDetalheResponse(
        String numVoo,
        String tipoVoo,
        LocalDate dataPartida,
        LocalTime horaPartida,
        LocalDateTime previsaoChegada,
        String statusVoo,
        String motivoAtrasoCancelamento,
        String dataHoraCancelamento,
        String codAeronave,
        String modelo,
        String fabricante,
        Integer capacidade,
        List<TrechoDetalheProjection> trechos
) {
}
