package com.airlines.company.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CriarAeronaveRequest {

    @NotBlank(message = "O campo 'codAeronave' é obrigatório.")
    private String codAeronave;

    @NotBlank(message = "O campo 'modelo' é obrigatório.")
    private String modelo;

    private LocalDate dataUltimaManutencao;
}
