package com.airlines.company.database.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "aeroporto", schema = "airline")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Aeroporto {

    @Id
    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(name = "codigo_iata", length = 3)
    private String codigoIata;

    @Column(name = "nome_aeroporto", nullable = false, length = 150)
    private String nomeAeroporto;

    @Column(name = "capacidade_pistas", nullable = false)
    private Integer capacidadePistas;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_cidade", nullable = false)
    private Cidade cidade;

    @Column(name = "altitude_pista_pes")
    private Integer altitudePistaPes;

    @Column(name = "site_aeroporto", length = 255)
    private String siteAeroporto;
}
