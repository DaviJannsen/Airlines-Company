package com.airlines.company.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminLoginRequest {

    @NotBlank(message = "O campo 'username' é obrigatório.")
    private String username;

    @NotBlank(message = "O campo 'senha' é obrigatório.")
    private String senha;
}
