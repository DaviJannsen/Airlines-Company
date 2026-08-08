package com.airlines.company.database.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "cidade", schema = "airline")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Cidade {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_cidade")
    private Integer idCidade;

    @Column(name = "nome_cidade", nullable = false, length = 100)
    private String nomeCidade;

    @Column(nullable = false, length = 100)
    private String pais;

    @Column(name = "clima_predominante", length = 20)
    private String climaPredominante;

    @Column(name = "idioma_local", length = 10)
    private String idiomaLocal;
}
