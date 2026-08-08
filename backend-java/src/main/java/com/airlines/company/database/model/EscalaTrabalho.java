package com.airlines.company.database.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "escala_trabalho", schema = "airline")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EscalaTrabalho {

    @EmbeddedId
    private EscalaTrabalhoId id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @MapsId("idFuncionario")
    @JoinColumn(name = "id_funcionario", nullable = false)
    private ComissaoDeBordo funcionario;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @MapsId("numVoo")
    @JoinColumn(name = "num_voo", nullable = false)
    private Voo voo;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @MapsId("codigoIata")
    @JoinColumn(name = "codigo_iata", nullable = false)
    private Aeroporto aeroporto;
}
