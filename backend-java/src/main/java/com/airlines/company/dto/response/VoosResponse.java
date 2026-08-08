package com.airlines.company.dto.response;

import com.airlines.company.dto.projection.VooResumoProjection;

import java.util.List;

public record VoosResponse(List<VooResumoProjection> voos, int total) {
}
