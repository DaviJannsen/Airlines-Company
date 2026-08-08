package com.airlines.company.dto.projection;

import java.math.BigDecimal;

public interface ReceitaClasseProjection {
    String getNumVoo();
    String getOrigem();
    String getDestino();
    String getClasseCabine();
    Long getQtdPassagens();
    BigDecimal getReceitaTotal();
    BigDecimal getTicketMedio();
}
