package com.airlines.company.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record ComissaoItemResponse(
        Integer idFuncionario,
        String nomeCompleto,
        String cpf,
        LocalDate dataAdmissao,
        BigDecimal salarioBase,
        String cargo,
        String licencaPiloto,
        String validadeCertificado,
        Boolean escaladoNesteVoo,
        Long totalVoos,
        List<IdiomaVinculoResponse> idiomas
) {
}
