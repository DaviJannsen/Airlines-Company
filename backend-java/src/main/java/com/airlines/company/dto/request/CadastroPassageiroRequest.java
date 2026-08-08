package com.airlines.company.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CadastroPassageiroRequest {

    @NotBlank(message = "O campo 'nomeCompleto' é obrigatório.")
    private String nomeCompleto;

    @NotNull(message = "O campo 'dataNascimento' é obrigatório.")
    private LocalDate dataNascimento;

    @NotBlank(message = "O campo 'nacionalidade' é obrigatório.")
    private String nacionalidade;

    @NotBlank(message = "O campo 'documentoIdentidade' é obrigatório.")
    private String documentoIdentidade;

    private String contatoEmergencia;

    @NotBlank(message = "O campo 'senha' é obrigatório.")
    @Size(min = 8, message = "A senha deve ter no mínimo 8 caracteres.")
    private String senha;
}
