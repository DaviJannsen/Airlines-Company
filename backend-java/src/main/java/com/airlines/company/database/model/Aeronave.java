package com.airlines.company.database.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "aeronave", schema = "airline")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Aeronave {

    @Id
    @Column(name = "cod_aeronave", length = 20)
    private String codAeronave;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "modelo", nullable = false)
    private ModeloAeronave modelo;

    @Column(name = "aviso_manutencao")
    @Builder.Default
    private Boolean avisoManutencao = false;

    @Column(name = "data_ultima_manutencao")
    private LocalDate dataUltimaManutencao;
}
