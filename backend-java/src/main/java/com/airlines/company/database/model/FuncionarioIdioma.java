package com.airlines.company.database.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "funcionario_idioma", schema = "airline")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FuncionarioIdioma {

    @EmbeddedId
    private FuncionarioIdiomaId id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @MapsId("idFuncionario")
    @JoinColumn(name = "id_funcionario", nullable = false)
    private ComissaoDeBordo funcionario;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @MapsId("codIdioma")
    @JoinColumn(name = "cod_idioma", nullable = false)
    private Idioma idioma;

    @Column(name = "nivel_fluencia", nullable = false, length = 15)
    private String nivelFluencia;

    @Column(name = "instituicao_certificado", length = 100)
    private String instituicaoCertificado;
}
