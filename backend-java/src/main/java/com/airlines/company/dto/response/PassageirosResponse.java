package com.airlines.company.dto.response;

import com.airlines.company.dto.projection.PassageiroResumoProjection;

import java.util.List;

public record PassageirosResponse(List<PassageiroResumoProjection> passageiros, int total) {
}
