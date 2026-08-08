package com.airlines.company.dto.projection;

import java.math.BigDecimal;

public interface TrechoDetalheProjection {
    Integer getCodigoTrecho();
    String getTipoTrecho();
    BigDecimal getDistanciaKm();
    String getCodigoIataOrigem();
    String getAeroportoOrigem();
    String getCidadeOrigem();
    String getCodigoIataDestino();
    String getAeroportoDestino();
    String getCidadeDestino();
}
