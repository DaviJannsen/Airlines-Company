package com.airlines.company.controller;

import com.airlines.company.dto.response.PassageirosResponse;
import com.airlines.company.service.PassageiroService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Substitui AdminPassageiroListView de admin_controller.py.
 */
@RestController
@RequestMapping("/admin/passageiros")
@RequiredArgsConstructor
public class AdminPassageiroController {

    private final PassageiroService passageiroService;

    @GetMapping
    public PassageirosResponse listar(@RequestParam(required = false, defaultValue = "") String busca) {
        return passageiroService.listarPassageiros(busca);
    }
}
