package com.airlines.company.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NegarEmbarqueRequest {

    @NotBlank(message = "O campo 'motivo' é obrigatório para negar o embarque.")
    private String motivo;
}
