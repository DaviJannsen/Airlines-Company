package com.airlines.company.database.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "comissario", schema = "airline")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Comissario {

    @Id
    @Column(name = "id_funcionario")
    private Integer idFuncionario;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "id_funcionario")
    private ComissaoDeBordo comissaoDeBordo;

    @Column(name = "validade_certificado", nullable = false)
    private LocalDate validadeCertificado;
}
