package com.airlines.company.dto.request;

import lombok.*;

import java.time.LocalDate;

/**
 * Todos os campos sao opcionais - somente os presentes (nao nulos) sao
 * atualizados, espelhando o PATCH parcial do MeuPerfilView original.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AtualizarPerfilRequest {

    private String nomeCompleto;
    private LocalDate dataNascimento;
    private String contatoEmergencia;
    private Boolean necessidadesEspeciais;
}
