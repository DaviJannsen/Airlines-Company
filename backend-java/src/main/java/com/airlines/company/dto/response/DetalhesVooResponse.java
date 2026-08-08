package com.airlines.company.dto.response;

import com.airlines.company.dto.projection.PassageiroVooProjection;

import java.util.List;

public record DetalhesVooResponse(
        VooDetalheResponse voo,
        List<PassageiroVooProjection> passageiros,
        List<ComissaoItemResponse> comissao
) {
}
