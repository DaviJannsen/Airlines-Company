package com.airlines.company.dto.response;

import com.airlines.company.dto.projection.ResumoEmbarqueProjection;

import java.util.List;

public record VoosComPresencaResponse(List<ResumoEmbarqueProjection> voos, int total, String filtro) {
}
