package com.airlines.company.dto.response;

import java.util.List;

public record ComissaoResponse(List<ComissaoItemResponse> funcionarios, int total) {
}
