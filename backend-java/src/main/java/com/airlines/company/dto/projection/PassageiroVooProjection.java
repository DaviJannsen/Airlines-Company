package com.airlines.company.dto.projection;

import java.math.BigDecimal;

public interface PassageiroVooProjection {
    Integer getIdPassageiro();
    String getNomeCompleto();
    String getDocumentoIdentidade();
    Integer getIdPassagem();
    String getAssentoPassageiro();
    String getClasseCabine();
    Boolean getBagagemDespachada();
    String getCodigoLocalizador();
    String getStatusPagamento();
    BigDecimal getValorTotal();
    String getStatusAutorizacao();
    String getStatusPresencaPassageiro();
}
