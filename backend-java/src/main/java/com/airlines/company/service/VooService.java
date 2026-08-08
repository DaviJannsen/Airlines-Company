package com.airlines.company.service;

import com.airlines.company.database.model.Aeronave;
import com.airlines.company.database.model.Aeroporto;
import com.airlines.company.database.model.ModeloAeronave;
import com.airlines.company.database.model.Trecho;
import com.airlines.company.database.model.Voo;
import com.airlines.company.database.repository.*;
import com.airlines.company.dto.projection.PainelVooProjection;
import com.airlines.company.dto.projection.ReceitaClasseProjection;
import com.airlines.company.dto.projection.TrechoDetalheProjection;
import com.airlines.company.dto.projection.VooDetalheProjection;
import com.airlines.company.dto.projection.VooResumoProjection;
import com.airlines.company.dto.request.CriarAeronaveRequest;
import com.airlines.company.dto.request.CriarModeloAeronaveRequest;
import com.airlines.company.dto.request.CriarVooRequest;
import com.airlines.company.dto.response.*;
import com.airlines.company.exception.BadRequestException;
import com.airlines.company.exception.BusinessRuleException;
import com.airlines.company.exception.NotFoundException;
import com.airlines.company.exception.PostgresMessageExtractor;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataAccessException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class VooService {

    private static final Map<String, Set<String>> TRANSICOES_VALIDAS = Map.of(
            "Programado", Set.of("Em Voo", "Atrasado", "Cancelado"),
            "Atrasado", Set.of("Em Voo", "Cancelado"),
            "Em Voo", Set.of("Concluído")
    );
    private static final Set<String> STATUS_VALIDOS =
            Set.of("Programado", "Em Voo", "Concluído", "Cancelado", "Atrasado");

    private final IVooRepository vooRepository;
    private final IAeronaveRepository aeronaveRepository;
    private final IModeloAeronaveRepository modeloAeronaveRepository;
    private final IAeroportoRepository aeroportoRepository;
    private final ITrechoRepository trechoRepository;

    public List<VooResumoProjection> listarVoos(String origem, String destino, LocalDate data, String tipoVoo, String busca) {
        String origemNormalizada = origem != null ? origem.toUpperCase() : null;
        String destinoNormalizado = destino != null ? destino.toUpperCase() : null;
        return vooRepository.listarComFiltros(origemNormalizada, destinoNormalizado, data, tipoVoo, busca);
    }

    public VooDetalheResponse buscarVooPorNumero(String numVoo) throws NotFoundException {
        VooDetalheProjection detalhe = vooRepository.buscarDetalhePorNumero(numVoo)
                .orElseThrow(() -> new NotFoundException("Voo não encontrado ou inexistente."));
        List<TrechoDetalheProjection> trechos = trechoRepository.buscarDetalhesPorVoo(numVoo);
        return toDetalheResponse(detalhe, trechos);
    }

    public static VooDetalheResponse toDetalheResponse(VooDetalheProjection d, List<TrechoDetalheProjection> trechos) {
        return new VooDetalheResponse(
                d.getNumVoo(), d.getTipoVoo(), d.getDataPartida(), d.getHoraPartida(), d.getPrevisaoChegada(),
                d.getStatusVoo(), d.getMotivoAtrasoCancelamento(), d.getDataHoraCancelamento(),
                d.getCodAeronave(), d.getModelo(), d.getFabricante(), d.getCapacidade(), trechos
        );
    }

    @Transactional(rollbackFor = Exception.class)
    public AtualizarStatusVooResponse atualizarStatusVoo(String numVoo, String novoStatus) throws BadRequestException, NotFoundException, BusinessRuleException {
        if (!STATUS_VALIDOS.contains(novoStatus)) {
            throw new BadRequestException("Status '" + novoStatus + "' inválido.");
        }

        Voo voo = vooRepository.findById(numVoo)
                .orElseThrow(() -> new NotFoundException("Voo '" + numVoo + "' não encontrado."));

        String statusAtual = voo.getStatusVoo();
        Set<String> permitidos = TRANSICOES_VALIDAS.getOrDefault(statusAtual, Set.of());

        if (!permitidos.contains(novoStatus)) {
            String listaPermitidos = permitidos.isEmpty() ? "nenhuma" : String.join(", ", permitidos);
            throw new BadRequestException(
                    "Não é possível mover de '" + statusAtual + "' para '" + novoStatus + "'. " +
                    "Transições permitidas: " + listaPermitidos + "."
            );
        }

        try {
            voo.setStatusVoo(novoStatus);
            vooRepository.saveAndFlush(voo);
        } catch (DataAccessException ex) {
            throw new BusinessRuleException(PostgresMessageExtractor.extract(ex));
        }

        return new AtualizarStatusVooResponse(numVoo, statusAtual, novoStatus);
    }

    public List<com.airlines.company.dto.projection.AeronaveResumoProjection> listarAeronaves() {
        return aeronaveRepository.listarComModelo();
    }

    public List<ModeloAeronaveResponse> listarModelosAeronave() {
        return modeloAeronaveRepository.findAllByOrderByFabricanteAscModeloAsc().stream()
                .map(m -> new ModeloAeronaveResponse(m.getModelo(), m.getFabricante(), m.getCapacidade(), m.getKmsRodados(), m.getPreco()))
                .toList();
    }

    @Transactional(rollbackFor = Exception.class)
    public AeronaveCriadaResponse criarAeronave(CriarAeronaveRequest request) throws BadRequestException {
        String cod = request.getCodAeronave().trim().toUpperCase();
        String modelo = request.getModelo().trim();

        if (aeronaveRepository.existsById(cod)) {
            throw new BadRequestException("Já existe uma aeronave com o código '" + cod + "'.");
        }
        ModeloAeronave modeloAeronave = modeloAeronaveRepository.findById(modelo)
                .orElseThrow(() -> new BadRequestException("Modelo '" + modelo + "' não encontrado."));

        aeronaveRepository.save(Aeronave.builder()
                .codAeronave(cod)
                .modelo(modeloAeronave)
                .avisoManutencao(false)
                .dataUltimaManutencao(request.getDataUltimaManutencao())
                .build());

        return new AeronaveCriadaResponse(cod, modelo, "Aeronave criada com sucesso.");
    }

    @Transactional(rollbackFor = Exception.class)
    public ModeloAeronaveCriadoResponse criarModeloAeronave(CriarModeloAeronaveRequest request) throws BadRequestException {
        String modelo = request.getModelo().trim();
        if (modeloAeronaveRepository.existsById(modelo)) {
            throw new BadRequestException("Modelo '" + modelo + "' já está cadastrado.");
        }

        modeloAeronaveRepository.save(ModeloAeronave.builder()
                .modelo(modelo)
                .fabricante(request.getFabricante().trim())
                .capacidade(request.getCapacidade())
                .kmsRodados(request.getKmsRodados())
                .preco(request.getPreco() != null && request.getPreco().signum() > 0 ? request.getPreco() : null)
                .build());

        return new ModeloAeronaveCriadoResponse(modelo, request.getFabricante().trim(), request.getCapacidade(), "Modelo criado com sucesso.");
    }

    @Transactional(rollbackFor = Exception.class)
    public VooCriadoResponse criarVoo(CriarVooRequest request) throws BadRequestException {
        String numVoo = request.getNumVoo().trim().toUpperCase();
        if (numVoo.length() > 10) {
            throw new BadRequestException("Número do voo deve ter no máximo 10 caracteres (atual: " + numVoo.length() + ").");
        }

        String iataOrigem = request.getIataOrigem() != null ? request.getIataOrigem().toUpperCase() : null;
        String iataDestino = request.getIataDestino() != null ? request.getIataDestino().toUpperCase() : null;
        boolean criarTrecho = iataOrigem != null && !iataOrigem.isBlank() && iataDestino != null && !iataDestino.isBlank();

        Aeroporto aeroportoOrigem = null;
        Aeroporto aeroportoDestino = null;
        if (criarTrecho) {
            aeroportoOrigem = aeroportoRepository.findById(iataOrigem)
                    .orElseThrow(() -> new BadRequestException(mensagemAeroportoNaoCadastrado(iataOrigem)));
            aeroportoDestino = aeroportoRepository.findById(iataDestino)
                    .orElseThrow(() -> new BadRequestException(mensagemAeroportoNaoCadastrado(iataDestino)));
        }

        Aeronave aeronave = aeronaveRepository.findById(request.getCodAeronave())
                .orElseThrow(() -> new BadRequestException("Aeronave '" + request.getCodAeronave() + "' não encontrada."));

        var conflito = vooRepository.findConflitoAlocacaoAeronave(request.getCodAeronave(), request.getDataPartida());
        if (conflito.isPresent()) {
            throw new BadRequestException(
                    "Aeronave '" + request.getCodAeronave() + "' já está alocada no voo '" + conflito.get() + "' nesta data.");
        }

        Voo voo = vooRepository.save(Voo.builder()
                .numVoo(numVoo)
                .tipoVoo(request.getTipoVoo())
                .dataPartida(request.getDataPartida())
                .horaPartida(request.getHoraPartida())
                .previsaoChegada(request.getPrevisaoChegada())
                .statusVoo(request.getStatusVoo() != null ? request.getStatusVoo() : "Programado")
                .aeronave(aeronave)
                .build());

        if (criarTrecho) {
            trechoRepository.save(Trecho.builder()
                    .tipoTrecho("Direto")
                    .distanciaKm(java.math.BigDecimal.valueOf(500))
                    .aeroportoOrigem(aeroportoOrigem)
                    .aeroportoDestino(aeroportoDestino)
                    .voo(voo)
                    .statusSazonalidade("Normal")
                    .viaAereaRegulamentada(true)
                    .build());
        }

        return new VooCriadoResponse("Voo criado com sucesso.", voo.getNumVoo());
    }

    private String mensagemAeroportoNaoCadastrado(String iata) {
        return "Aeroporto '" + iata + "' não está cadastrado no banco. Cadastre-o antes de criar o voo.";
    }

    public List<PainelVooProjection> relatorioPainelVoos() {
        return vooRepository.relatorioPainelVoos();
    }

    public List<ReceitaClasseProjection> relatorioReceitaPorClasse() {
        return vooRepository.relatorioReceitaPorClasse();
    }
}
