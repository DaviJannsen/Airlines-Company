package com.airlines.company.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EscalarFuncionarioRequest {

    @NotNull(message = "Campo 'idFuncionario' é obrigatório.")
    private Integer idFuncionario;
}
