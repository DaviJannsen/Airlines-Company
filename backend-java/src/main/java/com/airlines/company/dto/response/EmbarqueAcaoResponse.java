package com.airlines.company.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record EmbarqueAcaoResponse(String message, Integer idControleEmbarque, Boolean autoNegado) {

    public static EmbarqueAcaoResponse of(String message, Integer idControleEmbarque) {
        return new EmbarqueAcaoResponse(message, idControleEmbarque, null);
    }
}
