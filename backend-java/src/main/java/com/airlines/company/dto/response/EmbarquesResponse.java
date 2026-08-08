package com.airlines.company.dto.response;

import com.airlines.company.dto.projection.EmbarqueProjection;

import java.util.List;

public record EmbarquesResponse(List<EmbarqueProjection> embarques, int total) {
}
