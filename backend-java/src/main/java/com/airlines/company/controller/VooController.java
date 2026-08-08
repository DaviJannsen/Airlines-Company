package com.airlines.company.controller;

import com.airlines.company.dto.projection.VooResumoProjection;
import com.airlines.company.dto.response.VooDetalheResponse;
import com.airlines.company.exception.NotFoundException;
import com.airlines.company.service.VooService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

/**
 * Substitui backend/src/config/controllers/voo_controller.py - endpoints
 * publicos de consulta de voos (permitAll no SecurityConfig).
 */
@RestController
@RequestMapping("/voos")
@RequiredArgsConstructor
public class VooController {

    private final VooService vooService;

    @GetMapping
    public List<VooResumoProjection> listar(
            @RequestParam(required = false) String origem,
            @RequestParam(required = false) String destino,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate data,
            @RequestParam(required = false) String tipoVoo) {
        return vooService.listarVoos(origem, destino, data, tipoVoo, null);
    }

    @GetMapping("/{numVoo}")
    public VooDetalheResponse detalhe(@PathVariable String numVoo) throws NotFoundException {
        return vooService.buscarVooPorNumero(numVoo);
    }
}
