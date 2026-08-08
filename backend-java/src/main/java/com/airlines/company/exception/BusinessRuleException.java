package com.airlines.company.exception;

/**
 * Sinaliza violacao de uma regra de negocio imposta por trigger PL/pgSQL
 * (ex.: trg_valida_composicao_voo, trg_valida_capacidade_voo). A mensagem
 * carregada e' a extraida de DataIntegrityViolationException via
 * PostgresExceptionTranslator, equivalente ao uso de diag.message_primary
 * no backend Django original.
 */
public class BusinessRuleException extends Exception {

    public BusinessRuleException(String message) {
        super(message);
    }
}
