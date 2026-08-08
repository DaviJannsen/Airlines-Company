package com.airlines.company.database.model;

import jakarta.persistence.*;
import lombok.*;

/**
 * Conta de acesso administrativo. Substitui o auth_user nativo do Django -
 * criada pela migracao database/05_auth.sql, fora do modelo fisico original (TP3).
 */
@Entity
@Table(name = "usuario", schema = "airline")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Usuario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_usuario")
    private Integer idUsuario;

    @Column(nullable = false, unique = true, length = 60)
    private String username;

    @Column(name = "senha_hash", nullable = false)
    private String senhaHash;

    @Column(name = "nome_completo", nullable = false, length = 150)
    private String nomeCompleto;

    @Column(length = 150)
    private String email;

    @Column(name = "super_admin", nullable = false)
    @Builder.Default
    private Boolean superAdmin = false;
}
