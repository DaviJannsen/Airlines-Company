package com.airlines.company.database.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "passagem", schema = "airline")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Passagem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_passagem")
    private Integer idPassagem;

    @Column(name = "classe_cabine", nullable = false, length = 15)
    private String classeCabine;

    @Column(name = "assento_passageiro", nullable = false, length = 5)
    private String assentoPassageiro;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_passageiro", nullable = false)
    private Passageiro passageiro;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "codigo_localizador", nullable = false)
    private Reserva reserva;

    @Column(name = "bagagem_despachada")
    @Builder.Default
    private Boolean bagagemDespachada = false;

    @Column(name = "peso_bagagem", precision = 5, scale = 2)
    private BigDecimal pesoBagagem;
}
