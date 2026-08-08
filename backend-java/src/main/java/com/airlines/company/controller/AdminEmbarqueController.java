package com.airlines.company.controller;

import com.airlines.company.dto.request.NegarEmbarqueRequest;
import com.airlines.company.dto.response.EmbarqueAcaoResponse;
import com.airlines.company.dto.response.EmbarquesResponse;
import com.airlines.company.dto.response.VoosComPresencaResponse;
import com.airlines.company.exception.BadRequestException;
import com.airlines.company.exception.NotFoundException;
import com.airlines.company.service.PassageiroService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

/**
 * Substitui EmbarqueListView, VoosComPresencaView, AutorizarEmbarqueView,
 * NegarEmbarqueView e ConfirmarPagamentoView de admin_controller.py.
 */
@RestController
@RequestMapping("/admin/embarque")
@RequiredArgsConstructor
public class AdminEmbarqueController {

    private final PassageiroService passageiroService;

    @GetMapping
    public EmbarquesResponse listar(@RequestParam(required = false) String numVoo) {
        return passageiroService.listarEmbarque(numVoo);
    }

    @GetMapping("/voos-com-presenca")
    public VoosComPresencaResponse voosComPresenca(@RequestParam(required = false, defaultValue = "presentes") String filtro) {
        return passageiroService.resumoEmbarquePorVoo(filtro);
    }

    @PatchMapping("/{idControle}/autorizar")
    public EmbarqueAcaoResponse autorizar(@PathVariable Integer idControle) throws NotFoundException {
        return passageiroService.autorizarEmbarque(idControle);
    }

    @PatchMapping("/{idControle}/negar")
    public EmbarqueAcaoResponse negar(@PathVariable Integer idControle, @Valid @RequestBody NegarEmbarqueRequest request) throws NotFoundException {
        return passageiroService.negarEmbarque(idControle, request.getMotivo().trim());
    }

    @PatchMapping("/{idControle}/confirmar-pagamento")
    public EmbarqueAcaoResponse confirmarPagamento(@PathVariable Integer idControle) throws BadRequestException, NotFoundException {
        return passageiroService.confirmarPagamento(idControle);
    }
}
