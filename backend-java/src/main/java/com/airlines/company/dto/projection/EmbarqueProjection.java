package com.airlines.company.dto.projection;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

public interface EmbarqueProjection {
    Integer getIdControleEmbarque();
    LocalDateTime getDataHoraPassagemGate();
    String getStatusPresencaPassageiro();
    String getStatusAutorizacao();
    String getMotivoImpedimentoEmbarque();
    String getNumVoo();
    Integer getIdPassagem();
    String getNomePassageiro();
    String getDocumentoIdentidade();
    String getClasseCabine();
    String getAssentoPassageiro();
    String getCodigoLocalizador();
    String getStatusPagamento();
    String getValorTotal();
    LocalDate getDataPartida();
    LocalTime getHoraPartida();
    String getCidadeOrigem();
    String getCidadeDestino();
}
