package com.airlines.company.dto.request;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * Todos os campos sao opcionais - somente os presentes sao atualizados,
 * espelhando o PATCH parcial do FuncionarioUpdateView original.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AtualizarFuncionarioRequest {

    private String nomeCompleto;
    private BigDecimal salarioBase;
    private String licencaPiloto;
    private LocalDate validadeHabilitacao;
    private LocalDate validadeCertificado;
    private List<IdiomaVinculoRequest> idiomas;
}
