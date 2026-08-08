package com.airlines.company.dto.projection;

import java.math.BigDecimal;

public interface PainelVooProjection {
    String getNumVoo();
    String getTipoVoo();
    String getDataPartida();
    String getHoraPartida();
    String getStatusVoo();
    String getOrigem();
    String getDestino();
    BigDecimal getDistanciaKm();
    String getModeloAeronave();
    Integer getCapacidadeMaxima();
    Long getPassagensVendidas();
    Long getTripulacaoEscalada();
}
