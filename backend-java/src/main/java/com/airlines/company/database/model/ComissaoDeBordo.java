package com.airlines.company.database.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "comissao_de_bordo", schema = "airline")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ComissaoDeBordo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_funcionario")
    private Integer idFuncionario;

    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(nullable = false, unique = true, length = 11)
    private String cpf;

    @Column(name = "nome_completo", nullable = false, length = 150)
    private String nomeCompleto;

    @Column(name = "data_admissao", nullable = false)
    private LocalDate dataAdmissao;

    @Column(name = "salario_base", nullable = false, precision = 10, scale = 2)
    private BigDecimal salarioBase;

    // EAGER dispensado de proposito: o campo populado (piloto XOR comissario)
    // so e' necessario quando o service pede explicitamente (getPiloto/getComissario).
    @OneToOne(mappedBy = "comissaoDeBordo", fetch = FetchType.LAZY, cascade = CascadeType.ALL)
    private Piloto piloto;

    @OneToOne(mappedBy = "comissaoDeBordo", fetch = FetchType.LAZY, cascade = CascadeType.ALL)
    private Comissario comissario;
}
