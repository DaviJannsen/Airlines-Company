package com.airlines.company.dto.response;

import java.math.BigDecimal;

public record SolicitarPassagemResponse(
        String message,
        String codigoLocalizador,
        String assento,
        String classeCabine,
        String numVoo,
        BigDecimal valorTotal,
        Boolean bagagemDespachada,
        BigDecimal pesoBagagem,
        Integer idControleEmbarque
) {
}
