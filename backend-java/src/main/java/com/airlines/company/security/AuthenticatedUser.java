package com.airlines.company.security;

/**
 * Principal autenticado extraido dos claims do JWT. Substitui os objetos
 * mock (_PassageiroUser) e o request.user do DRF no backend original.
 */
public record AuthenticatedUser(String subject, String role, String nome, Integer idPassageiro) {
}
