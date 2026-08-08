package com.airlines.company.database.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "modelo_aeronave", schema = "airline")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ModeloAeronave {

    @Id
    @Column(length = 80)
    private String modelo;

    @Column(nullable = false, length = 100)
    private String fabricante;

    @Column(nullable = false)
    private Integer capacidade;

    @Column(name = "kms_rodados")
    private Integer kmsRodados;

    @Column(precision = 15, scale = 2)
    private BigDecimal preco;
}
