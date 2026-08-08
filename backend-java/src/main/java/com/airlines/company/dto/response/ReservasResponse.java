package com.airlines.company.dto.response;

import com.airlines.company.dto.projection.ReservaDetalheProjection;

import java.util.List;

public record ReservasResponse(List<ReservaDetalheProjection> reservas) {
}
