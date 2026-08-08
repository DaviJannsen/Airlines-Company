package com.airlines.company.dto.response;

import java.math.BigDecimal;

public record ModeloAeronaveResponse(String modelo, String fabricante, Integer capacidade, Integer kmsRodados, BigDecimal preco) {
}
