package com.airlines.company.controller;

import com.airlines.company.dto.request.CriarVooRequest;
import com.airlines.company.dto.request.AtualizarStatusVooRequest;
import com.airlines.company.dto.request.EscalarFuncionarioRequest;
import com.airlines.company.dto.response.*;
import com.airlines.company.exception.BadRequestException;
import com.airlines.company.exception.BusinessRuleException;
import com.airlines.company.exception.NotFoundException;
import com.airlines.company.service.FuncionarioService;
import com.airlines.company.service.VooService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

/**
 * Substitui as views de voos/escala de admin_controller.py
 * (AdminVooListCreateView, VooStatusView, VooDetalhesView, EscalaView,
 * EscalaRemoverView). Protegido por ROLE_ADMIN via SecurityConfig.
 */
@RestController
@RequestMapping("/admin/voos")
@RequiredArgsConstructor
public class AdminVooController {

    private final VooService vooService;
    private final FuncionarioService funcionarioService;

    @GetMapping
    public VoosResponse listar(@RequestParam(required = false, defaultValue = "") String busca) {
        var voos = vooService.listarVoos(null, null, null, null, busca.isBlank() ? null : busca.trim());
        return new VoosResponse(voos, voos.size());
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public VooCriadoResponse criar(@Valid @RequestBody CriarVooRequest request) throws BadRequestException {
        return vooService.criarVoo(request);
    }

    @PatchMapping("/{numVoo}/status")
    public AtualizarStatusVooResponse atualizarStatus(@PathVariable String numVoo, @Valid @RequestBody AtualizarStatusVooRequest request)
            throws BadRequestException, NotFoundException, BusinessRuleException {
        return vooService.atualizarStatusVoo(numVoo, request.getStatus().trim());
    }

    @GetMapping("/{numVoo}/detalhes")
    public DetalhesVooResponse detalhes(@PathVariable String numVoo) throws NotFoundException {
        VooDetalheResponse voo = vooService.buscarVooPorNumero(numVoo);
        var passageiros = funcionarioService.listarPassageirosDoVoo(numVoo);
        var comissao = funcionarioService.listarComissao(numVoo, null).funcionarios();
        return new DetalhesVooResponse(voo, passageiros, comissao);
    }

    @PostMapping("/{numVoo}/escala")
    @ResponseStatus(HttpStatus.CREATED)
    public EscalaResponse escalar(@PathVariable String numVoo, @Valid @RequestBody EscalarFuncionarioRequest request) throws BadRequestException {
        return funcionarioService.escalarFuncionario(request.getIdFuncionario(), numVoo);
    }

    @DeleteMapping("/{numVoo}/escala/{idFuncionario}")
    public EscalaResponse desescalar(@PathVariable String numVoo, @PathVariable Integer idFuncionario) throws NotFoundException {
        return funcionarioService.desescalarFuncionario(idFuncionario, numVoo);
    }
}
