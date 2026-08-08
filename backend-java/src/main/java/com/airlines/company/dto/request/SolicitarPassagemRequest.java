package com.airlines.company.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SolicitarPassagemRequest {

    @NotBlank(message = "O campo 'numVoo' é obrigatório.")
    private String numVoo;

    @Builder.Default
    private String classeCabine = "Econômica";

    @Builder.Default
    private Boolean bagagemDespachada = false;

    private BigDecimal pesoBagagem;
}
