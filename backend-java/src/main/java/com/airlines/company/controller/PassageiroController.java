package com.airlines.company.controller;

import com.airlines.company.dto.request.AtualizarPerfilRequest;
import com.airlines.company.dto.request.SolicitarPassagemRequest;
import com.airlines.company.dto.response.MessageResponse;
import com.airlines.company.dto.response.PerfilPassageiroResponse;
import com.airlines.company.dto.response.ReservasResponse;
import com.airlines.company.dto.response.SolicitarPassagemResponse;
import com.airlines.company.exception.BadRequestException;
import com.airlines.company.exception.NotFoundException;
import com.airlines.company.security.AuthenticatedUser;
import com.airlines.company.service.PassageiroService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

/**
 * Substitui backend/src/config/controllers/passageiro_controller.py.
 * O idPassageiro vem do claim id_passageiro do JWT (AuthenticatedUser),
 * equivalente a request.user.id_passageiro no DRF original.
 */
@RestController
@RequestMapping("/passageiro")
@RequiredArgsConstructor
public class PassageiroController {

    private final PassageiroService passageiroService;

    @PostMapping("/reservar")
    @ResponseStatus(HttpStatus.CREATED)
    public SolicitarPassagemResponse reservar(@AuthenticationPrincipal AuthenticatedUser user,
                                               @Valid @RequestBody SolicitarPassagemRequest request)
            throws BadRequestException, NotFoundException {
        return passageiroService.solicitarPassagem(user.idPassageiro(), request);
    }

    @GetMapping("/reservas")
    public ReservasResponse minhasReservas(@AuthenticationPrincipal AuthenticatedUser user) {
        return passageiroService.listarReservasDoPassageiro(user.idPassageiro());
    }

    @GetMapping("/perfil")
    public PerfilPassageiroResponse meuPerfil(@AuthenticationPrincipal AuthenticatedUser user) throws NotFoundException {
        return passageiroService.buscarPerfil(user.idPassageiro());
    }

    @PatchMapping("/perfil")
    public MessageResponse atualizarPerfil(@AuthenticationPrincipal AuthenticatedUser user, @RequestBody AtualizarPerfilRequest request)
            throws NotFoundException, BadRequestException {
        return passageiroService.atualizarPerfil(user.idPassageiro(), request);
    }
}
