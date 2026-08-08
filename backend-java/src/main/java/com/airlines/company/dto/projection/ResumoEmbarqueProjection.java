package com.airlines.company.dto.projection;

public interface ResumoEmbarqueProjection {
    String getNumVoo();
    String getCidadeOrigem();
    String getCidadeDestino();
    String getDataPartida();
    String getHoraPartida();
    String getStatusVoo();
    Long getTotalPassageiros();
    Long getPresentes();
    Long getEmbarquePendente();
    Long getPagPendente();
}
