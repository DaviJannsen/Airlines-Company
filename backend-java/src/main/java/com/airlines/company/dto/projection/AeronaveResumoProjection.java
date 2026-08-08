package com.airlines.company.dto.projection;

import java.time.LocalDate;

public interface AeronaveResumoProjection {
    String getCodAeronave();
    String getModelo();
    String getFabricante();
    Integer getCapacidade();
    Boolean getAvisoManutencao();
    LocalDate getDataUltimaManutencao();
}
