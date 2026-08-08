package com.airlines.company.database.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "reserva", schema = "airline")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Reserva {

    @Id
    @Column(name = "codigo_localizador", length = 20)
    private String codigoLocalizador;

    @Column(name = "data_criacao", nullable = false)
    private LocalDate dataCriacao;

    @Column(name = "status_pagamento", nullable = false, length = 15)
    private String statusPagamento;

    @Column(name = "valor_total", nullable = false, precision = 10, scale = 2)
    private BigDecimal valorTotal;

    @Column(name = "agencia_parceira")
    @Builder.Default
    private Boolean agenciaParceira = false;

    @Column(name = "cupom_desconto")
    @Builder.Default
    private Boolean cupomDesconto = false;
}
