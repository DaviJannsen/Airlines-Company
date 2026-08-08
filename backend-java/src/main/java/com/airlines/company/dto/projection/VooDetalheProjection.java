package com.airlines.company.dto.projection;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

public interface VooDetalheProjection {
    String getNumVoo();
    String getTipoVoo();
    LocalDate getDataPartida();
    LocalTime getHoraPartida();
    LocalDateTime getPrevisaoChegada();
    String getStatusVoo();
    String getMotivoAtrasoCancelamento();
    String getDataHoraCancelamento();
    String getCodAeronave();
    String getModelo();
    String getFabricante();
    Integer getCapacidade();
}
