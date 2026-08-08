package com.airlines.company.dto.projection;

import java.time.LocalDate;

public interface PassageiroResumoProjection {
    Integer getIdPassageiro();
    String getNomeCompleto();
    LocalDate getDataNascimento();
    String getDocumentoIdentidade();
    Boolean getNecessidadesEspeciais();
    String getContatoEmergencia();
    Long getTotalPassagens();
}
