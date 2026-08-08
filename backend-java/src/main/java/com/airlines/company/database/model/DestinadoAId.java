package com.airlines.company.database.model;

import jakarta.persistence.Embeddable;
import lombok.*;

import java.io.Serializable;

@Embeddable
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode
public class DestinadoAId implements Serializable {

    private Integer idPassagem;
    private String numVoo;
}
