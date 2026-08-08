package com.airlines.company.database.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "passageiro", schema = "airline")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Passageiro {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_passageiro")
    private Integer idPassageiro;

    @Column(name = "nome_completo", nullable = false, length = 150)
    private String nomeCompleto;

    @Column(name = "data_nascimento", nullable = false)
    private LocalDate dataNascimento;

    @Column(nullable = false, length = 80)
    private String nacionalidade;

    @Column(name = "documento_identidade", nullable = false, unique = true, length = 50)
    private String documentoIdentidade;

    @Column(name = "contato_emergencia", length = 20)
    private String contatoEmergencia;

    @Column(name = "necessidades_especiais")
    @Builder.Default
    private Boolean necessidadesEspeciais = false;

    /**
     * Hash BCrypt da senha escolhida no cadastro (coluna adicionada em
     * database/05_auth.sql). O sistema Django original nao tinha senha real -
     * comparava o proprio documento em texto puro.
     */
    @Column(name = "senha_hash", nullable = false)
    private String senhaHash;
}
