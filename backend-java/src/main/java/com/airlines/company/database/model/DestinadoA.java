package com.airlines.company.database.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "destinado_a", schema = "airline")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DestinadoA {

    @EmbeddedId
    private DestinadoAId id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @MapsId("idPassagem")
    @JoinColumn(name = "id_passagem", nullable = false)
    private Passagem passagem;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @MapsId("numVoo")
    @JoinColumn(name = "num_voo", nullable = false)
    private Voo voo;
}
