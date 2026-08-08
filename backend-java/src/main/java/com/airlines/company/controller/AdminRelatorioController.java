package com.airlines.company.controller;

import com.airlines.company.dto.response.RelatorioResponse;
import com.airlines.company.service.VooService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Substitui RelatorioView de admin_controller.py.
 * tipo=painel  -> vw_painel_voos (VIEW + JOIN + GROUP BY + COUNT)
 * tipo=receita -> JOIN x4 + GROUP BY + COUNT + SUM + AVG + HAVING
 */
@RestController
@RequestMapping("/admin/relatorios")
@RequiredArgsConstructor
public class AdminRelatorioController {

    private final VooService vooService;

    @GetMapping
    public RelatorioResponse relatorio(@RequestParam(required = false, defaultValue = "painel") String tipo) {
        if ("receita".equals(tipo)) {
            return new RelatorioResponse(vooService.relatorioReceitaPorClasse(), tipo);
        }
        return new RelatorioResponse(vooService.relatorioPainelVoos(), "painel");
    }
}
