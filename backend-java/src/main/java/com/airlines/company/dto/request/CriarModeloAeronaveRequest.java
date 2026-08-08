package com.airlines.company.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CriarModeloAeronaveRequest {

    @NotBlank(message = "O campo 'modelo' é obrigatório.")
    private String modelo;

    @NotBlank(message = "O campo 'fabricante' é obrigatório.")
    private String fabricante;

    @NotNull(message = "O campo 'capacidade' é obrigatório.")
    @Positive(message = "Capacidade deve ser maior que zero.")
    private Integer capacidade;

    private Integer kmsRodados;
    private BigDecimal preco;
}
