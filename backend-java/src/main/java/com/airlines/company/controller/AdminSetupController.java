package com.airlines.company.controller;

import com.airlines.company.dto.request.AdminSetupRequest;
import com.airlines.company.dto.response.AdminSetupCheckResponse;
import com.airlines.company.dto.response.MessageResponse;
import com.airlines.company.exception.ConflictException;
import com.airlines.company.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

/**
 * Substitui AdminSetupCheckView/AdminSetupView de admin_controller.py.
 * Sem autenticacao - usado apenas para criar o primeiro administrador,
 * e bloqueado automaticamente apos essa criacao.
 */
@RestController
@RequestMapping("/admin")
@RequiredArgsConstructor
public class AdminSetupController {

    private final AuthService authService;

    @GetMapping("/check-setup")
    public AdminSetupCheckResponse checkSetup() {
        return authService.verificarSetup();
    }

    @PostMapping("/setup")
    @ResponseStatus(HttpStatus.CREATED)
    public MessageResponse setup(@Valid @RequestBody AdminSetupRequest request) throws ConflictException {
        authService.criarPrimeiroAdmin(request);
        return new MessageResponse("Administrador criado com sucesso.");
    }
}
