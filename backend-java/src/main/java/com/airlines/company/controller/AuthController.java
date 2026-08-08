package com.airlines.company.controller;

import com.airlines.company.dto.request.AdminLoginRequest;
import com.airlines.company.dto.request.CadastroPassageiroRequest;
import com.airlines.company.dto.request.LoginRequest;
import com.airlines.company.dto.request.RefreshTokenRequest;
import com.airlines.company.dto.response.CadastroPassageiroResponse;
import com.airlines.company.dto.response.LoginResponse;
import com.airlines.company.exception.BadRequestException;
import com.airlines.company.exception.UnauthorizedException;
import com.airlines.company.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

/**
 * Substitui backend/src/config/controllers/auth_controller.py.
 * A rota /login/passageiro mantem o comportamento "inteligente" original:
 * decide entre login de admin ou passageiro pelo prefixo do documento.
 */
@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@Validated
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login/passageiro")
    public LoginResponse loginPassageiro(@Valid @RequestBody LoginRequest request) throws UnauthorizedException {
        return authService.loginUnificado(request.getDocumentoIdentidade(), request.getSenha());
    }

    @PostMapping("/login/admin")
    public LoginResponse loginAdmin(@Valid @RequestBody AdminLoginRequest request) throws UnauthorizedException {
        return authService.loginAdmin(request.getUsername(), request.getSenha());
    }

    @PostMapping("/cadastro")
    @ResponseStatus(HttpStatus.CREATED)
    public CadastroPassageiroResponse cadastro(@Valid @RequestBody CadastroPassageiroRequest request) throws BadRequestException {
        return authService.cadastrarPassageiro(request);
    }

    @PostMapping("/refresh")
    public LoginResponse refresh(@Valid @RequestBody RefreshTokenRequest request) throws UnauthorizedException {
        return authService.refresh(request.getRefresh());
    }
}
