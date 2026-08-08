package com.airlines.company.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AtualizarStatusVooRequest {

    @NotBlank(message = "Campo 'status' é obrigatório.")
    private String status;
}
