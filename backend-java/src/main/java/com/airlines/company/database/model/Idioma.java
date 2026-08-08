package com.airlines.company.database.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "idioma", schema = "airline")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Idioma {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "cod_idioma")
    private Integer codIdioma;

    @Column(nullable = false, length = 80)
    private String nome;
}
