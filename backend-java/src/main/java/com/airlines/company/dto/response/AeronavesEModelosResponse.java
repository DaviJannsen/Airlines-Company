package com.airlines.company.dto.response;

import com.airlines.company.dto.projection.AeronaveResumoProjection;

import java.util.List;

public record AeronavesEModelosResponse(List<AeronaveResumoProjection> aeronaves, List<ModeloAeronaveResponse> modelos) {
}
