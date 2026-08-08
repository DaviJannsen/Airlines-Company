package com.airlines.company.database.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Entity
@Table(name = "voo", schema = "airline")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Voo {

    @Id
    @Column(name = "num_voo", length = 10)
    private String numVoo;

    @Column(name = "tipo_voo", nullable = false, length = 15)
    private String tipoVoo;

    @Column(name = "data_partida", nullable = false)
    private LocalDate dataPartida;

    @Column(name = "status_voo", nullable = false, length = 15)
    @Builder.Default
    private String statusVoo = "Programado";

    @Column(name = "hora_partida", nullable = false)
    private LocalTime horaPartida;

    @Column(name = "previsao_chegada", nullable = false)
    private LocalDateTime previsaoChegada;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "cod_aeronave", nullable = false)
    private Aeronave aeronave;

    @Column(name = "data_hora_efetiva_cancelamento")
    private LocalDateTime dataHoraEfetivaCancelamento;

    @Column(name = "motivo_atraso_cancelamento", length = 300)
    private String motivoAtrasoCancelamento;
}
