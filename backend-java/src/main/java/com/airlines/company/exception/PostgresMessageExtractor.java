package com.airlines.company.exception;

import org.springframework.dao.DataAccessException;

/**
 * Extrai a mensagem primaria de um RAISE EXCEPTION disparado por trigger
 * PL/pgSQL a partir de uma DataAccessException do Spring. Equivalente ao
 * uso de err.__cause__.diag.message_primary no backend Django original
 * (services/funcionario_service.py, services/voo_service.py).
 */
public final class PostgresMessageExtractor {

    private PostgresMessageExtractor() {
    }

    public static String extract(DataAccessException ex) {
        Throwable root = ex.getMostSpecificCause();
        String message = root.getMessage();
        if (message == null || message.isBlank()) {
            return "Erro de integridade no banco de dados.";
        }
        String firstLine = message.lines().findFirst().orElse(message);
        return firstLine.replaceFirst("^ERROR:\\s*", "").trim();
    }
}
