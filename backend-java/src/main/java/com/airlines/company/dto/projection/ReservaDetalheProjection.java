package com.airlines.company.dto.projection;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

public interface ReservaDetalheProjection {
    String getCodigoLocalizador();
    LocalDate getDataCriacao();
    String getStatusPagamento();
    BigDecimal getValorTotal();
    Boolean getAgenciaParceira();
    Integer getIdPassagem();
    String getClasseCabine();
    String getAssentoPassageiro();
    Boolean getBagagemDespachada();
    BigDecimal getPesoBagagem();
    String getNumVoo();
    String getTipoVoo();
    LocalDate getDataPartida();
    LocalTime getHoraPartida();
    LocalDateTime getPrevisaoChegada();
    String getStatusVoo();
    String getCidadeOrigem();
    String getCidadeDestino();
    String getStatusPresencaPassageiro();
}
