package com.airlines.company.dto.projection;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

public interface VooResumoProjection {
    String getNumVoo();
    String getTipoVoo();
    LocalDate getDataPartida();
    LocalTime getHoraPartida();
    LocalDateTime getPrevisaoChegada();
    String getStatusVoo();
    String getCodAeronave();
    String getIataOrigem();
    String getAeroportoOrigem();
    String getCidadeOrigem();
    String getPaisOrigem();
    String getIataDestino();
    String getAeroportoDestino();
    String getCidadeDestino();
    String getPaisDestino();
    BigDecimal getDistanciaKm();
    String getTipoTrecho();
    Integer getCapacidadeTotal();
    Long getPassagensEmitidas();
    Integer getAssentosRestantes();
    String getDataHoraCancelamento();
    Long getPassagensEmbarcadas();
}
