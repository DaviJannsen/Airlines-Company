package com.airlines.company.dto.request;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class IdiomaVinculoRequest {

    private Integer codIdioma;

    @Builder.Default
    private String nivelFluencia = "Nativo";
}
