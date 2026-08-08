package com.airlines.company.controller;

import com.airlines.company.dto.request.AtualizarFuncionarioRequest;
import com.airlines.company.dto.request.CriarFuncionarioRequest;
import com.airlines.company.dto.response.*;
import com.airlines.company.exception.BadRequestException;
import com.airlines.company.exception.BusinessRuleException;
import com.airlines.company.exception.NotFoundException;
import com.airlines.company.service.FuncionarioService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

/**
 * Substitui ComissaoListView, IdiomaListView, FuncionarioCreateView e
 * FuncionarioUpdateView de admin_controller.py.
 */
@RestController
@RequestMapping("/admin")
@RequiredArgsConstructor
public class AdminFuncionarioController {

    private final FuncionarioService funcionarioService;

    @GetMapping("/comissao")
    public ComissaoResponse listarComissao(@RequestParam(required = false, defaultValue = "") String busca) {
        return funcionarioService.listarComissao(null, busca.isBlank() ? null : busca);
    }

    @GetMapping("/idiomas")
    public IdiomasResponse listarIdiomas() {
        return funcionarioService.listarIdiomas();
    }

    @PostMapping("/funcionarios")
    @ResponseStatus(HttpStatus.CREATED)
    public FuncionarioCriadoResponse criar(@Valid @RequestBody CriarFuncionarioRequest request) throws BadRequestException, BusinessRuleException {
        return funcionarioService.criarFuncionario(request);
    }

    @PatchMapping("/funcionarios/{idFuncionario}")
    public FuncionarioAtualizadoResponse atualizar(@PathVariable Integer idFuncionario, @RequestBody AtualizarFuncionarioRequest request)
            throws NotFoundException, BusinessRuleException {
        return funcionarioService.atualizarFuncionario(idFuncionario, request);
    }

    @DeleteMapping("/funcionarios/{idFuncionario}")
    public MessageResponse deletar(@PathVariable Integer idFuncionario) throws BadRequestException, NotFoundException, BusinessRuleException {
        return funcionarioService.deletarFuncionario(idFuncionario);
    }
}
