package com.airlines.company.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CriarVooRequest {

    @NotBlank(message = "O campo 'numVoo' é obrigatório.")
    private String numVoo;

    @NotBlank(message = "O campo 'tipoVoo' é obrigatório.")
    private String tipoVoo;

    @NotNull(message = "O campo 'dataPartida' é obrigatório.")
    private LocalDate dataPartida;

    @NotNull(message = "O campo 'horaPartida' é obrigatório.")
    private LocalTime horaPartida;

    @NotNull(message = "O campo 'previsaoChegada' é obrigatório.")
    private LocalDateTime previsaoChegada;

    @NotBlank(message = "O campo 'codAeronave' é obrigatório.")
    private String codAeronave;

    @Builder.Default
    private String statusVoo = "Programado";

    private String iataOrigem;
    private String iataDestino;
}
