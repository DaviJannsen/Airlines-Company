package com.airlines.company.dto.projection;

import java.math.BigDecimal;
import java.time.LocalDate;

public interface ComissaoProjection {
    Integer getIdFuncionario();
    String getNomeCompleto();
    String getCpf();
    LocalDate getDataAdmissao();
    BigDecimal getSalarioBase();
    String getCargo();
    String getLicencaPiloto();
    String getValidadeCertificado();
    Boolean getEscaladoNesteVoo();
    Long getTotalVoos();
    String getIdiomasJson();
}
