package com.airlines.company.dto.response;

import java.time.LocalDate;

public record PerfilPassageiroResponse(
        Integer idPassageiro,
        String nomeCompleto,
        LocalDate dataNascimento,
        String documentoIdentidade,
        String contatoEmergencia,
        Boolean necessidadesEspeciais
) {
}
