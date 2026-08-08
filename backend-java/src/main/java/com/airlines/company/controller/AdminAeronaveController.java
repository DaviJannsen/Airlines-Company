package com.airlines.company.controller;

import com.airlines.company.dto.request.CriarAeronaveRequest;
import com.airlines.company.dto.request.CriarModeloAeronaveRequest;
import com.airlines.company.dto.response.AeronaveCriadaResponse;
import com.airlines.company.dto.response.AeronavesEModelosResponse;
import com.airlines.company.dto.response.ModeloAeronaveCriadoResponse;
import com.airlines.company.exception.BadRequestException;
import com.airlines.company.service.VooService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

/**
 * Substitui AeronaveListView e ModeloAeronaveCreateView de admin_controller.py.
 */
@RestController
@RequestMapping("/admin")
@RequiredArgsConstructor
public class AdminAeronaveController {

    private final VooService vooService;

    @GetMapping("/aeronaves")
    public AeronavesEModelosResponse listar() {
        return new AeronavesEModelosResponse(vooService.listarAeronaves(), vooService.listarModelosAeronave());
    }

    @PostMapping("/aeronaves")
    @ResponseStatus(HttpStatus.CREATED)
    public AeronaveCriadaResponse criarAeronave(@Valid @RequestBody CriarAeronaveRequest request) throws BadRequestException {
        return vooService.criarAeronave(request);
    }

    @PostMapping("/modelos-aeronave")
    @ResponseStatus(HttpStatus.CREATED)
    public ModeloAeronaveCriadoResponse criarModelo(@Valid @RequestBody CriarModeloAeronaveRequest request) throws BadRequestException {
        return vooService.criarModeloAeronave(request);
    }
}
