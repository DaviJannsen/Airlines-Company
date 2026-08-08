package com.airlines.company.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CriarFuncionarioRequest {

    @NotBlank(message = "Cargo deve ser 'Piloto' ou 'Comissário'.")
    private String cargo;

    @NotBlank(message = "Nome, CPF, data de admissão e salário são obrigatórios.")
    private String nomeCompleto;

    @NotBlank(message = "Nome, CPF, data de admissão e salário são obrigatórios.")
    private String cpf;

    private LocalDate dataAdmissao;
    private BigDecimal salarioBase;

    // Obrigatorios apenas para cargo = Piloto (validado no service)
    private String licencaPiloto;
    private LocalDate validadeHabilitacao;

    // Obrigatorio apenas para cargo = Comissário (validado no service)
    private LocalDate validadeCertificado;

    private List<IdiomaVinculoRequest> idiomas;
}
