package com.airlines.company.database.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "controle_embarque", schema = "airline")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ControleEmbarque {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_controle_embarque")
    private Integer idControleEmbarque;

    @Column(name = "data_hora_passagem_gate", nullable = false)
    private LocalDateTime dataHoraPassagemGate;

    @Column(name = "status_presenca_passageiro", nullable = false, length = 10)
    @Builder.Default
    private String statusPresencaPassageiro = "Em Espera";

    @Column(name = "status_autorizacao", nullable = false, length = 10)
    @Builder.Default
    private String statusAutorizacao = "Pendente";

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "num_voo", nullable = false)
    private Voo voo;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_passagem", nullable = false)
    private Passagem passagem;

    @Column(name = "motivo_impedimento_embarque", length = 300)
    private String motivoImpedimentoEmbarque;
}
