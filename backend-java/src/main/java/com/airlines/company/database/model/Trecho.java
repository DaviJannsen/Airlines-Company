package com.airlines.company.database.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "trecho", schema = "airline")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Trecho {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "codigo_trecho")
    private Integer codigoTrecho;

    @Column(name = "tipo_trecho", nullable = false, length = 50)
    private String tipoTrecho;

    @Column(name = "distancia_km", nullable = false, precision = 8, scale = 2)
    private BigDecimal distanciaKm;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "codigo_iata_origem", nullable = false)
    private Aeroporto aeroportoOrigem;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "codigo_iata_destino", nullable = false)
    private Aeroporto aeroportoDestino;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "num_voo", nullable = false)
    private Voo voo;

    @Column(name = "status_sazonalidade", length = 12)
    @Builder.Default
    private String statusSazonalidade = "Normal";

    @Column(name = "via_aerea_regulamentada")
    @Builder.Default
    private Boolean viaAereaRegulamentada = true;
}
