package com.airlines.company.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoginRequest {

    @NotBlank(message = "O campo 'documentoIdentidade' é obrigatório.")
    private String documentoIdentidade;

    @NotBlank(message = "O campo 'senha' é obrigatório.")
    private String senha;
}
