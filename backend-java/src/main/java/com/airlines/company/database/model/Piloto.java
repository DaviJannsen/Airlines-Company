package com.airlines.company.database.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "piloto", schema = "airline")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Piloto {

    @Id
    @Column(name = "id_funcionario")
    private Integer idFuncionario;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "id_funcionario")
    private ComissaoDeBordo comissaoDeBordo;

    @Column(name = "licenca_piloto", nullable = false, unique = true, length = 30)
    private String licencaPiloto;

    @Column(name = "validade_habilitacao", nullable = false)
    private LocalDate validadeHabilitacao;
}
