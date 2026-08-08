package com.airlines.company.database.model;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.io.Serializable;

@Embeddable
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode
public class EscalaTrabalhoId implements Serializable {

    private Integer idFuncionario;
    private String numVoo;

    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(length = 3)
    private String codigoIata;
}
