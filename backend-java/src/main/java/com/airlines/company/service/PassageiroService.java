package com.airlines.company.service;

import com.airlines.company.database.model.*;
import com.airlines.company.database.repository.*;
import com.airlines.company.dto.projection.EmbarqueProjection;
import com.airlines.company.dto.projection.PassageiroResumoProjection;
import com.airlines.company.dto.projection.ReservaDetalheProjection;
import com.airlines.company.dto.projection.ResumoEmbarqueProjection;
import com.airlines.company.dto.request.AtualizarPerfilRequest;
import com.airlines.company.dto.request.SolicitarPassagemRequest;
import com.airlines.company.dto.response.*;
import com.airlines.company.exception.BadRequestException;
import com.airlines.company.exception.NotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.security.SecureRandom;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class PassageiroService {

    private static final Map<String, BigDecimal> PRECOS_POR_CLASSE = Map.of(
            "Econômica", BigDecimal.valueOf(850.00),
            "Executiva", BigDecimal.valueOf(2500.00),
            "Primeira Classe", BigDecimal.valueOf(8000.00)
    );
    private static final Set<String> CLASSES_VALIDAS = PRECOS_POR_CLASSE.keySet();
    private static final Set<String> STATUS_VOO_SEM_RESERVA = Set.of("Cancelado", "Concluído");
    private static final char[] LETRAS_ASSENTO = {'A', 'B', 'C', 'D', 'E', 'F'};
    private static final String CARACTERES_LOCALIZADOR = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    private static final SecureRandom RANDOM = new SecureRandom();

    private final IPassageiroRepository passageiroRepository;
    private final IReservaRepository reservaRepository;
    private final IPassagemRepository passagemRepository;
    private final IDestinadoARepository destinadoARepository;
    private final IControleEmbarqueRepository controleEmbarqueRepository;
    private final IVooRepository vooRepository;

    public ReservasResponse listarReservasDoPassageiro(Integer idPassageiro) {
        List<ReservaDetalheProjection> reservas = passagemRepository.listarReservasDoPassageiro(idPassageiro);
        return new ReservasResponse(reservas);
    }

    public PassageirosResponse listarPassageiros(String busca) {
        List<PassageiroResumoProjection> passageiros = passageiroRepository.listarComBusca(busca);
        return new PassageirosResponse(passageiros, passageiros.size());
    }

    public PerfilPassageiroResponse buscarPerfil(Integer idPassageiro) throws NotFoundException {
        Passageiro passageiro = passageiroRepository.findById(idPassageiro)
                .orElseThrow(() -> new NotFoundException("Passageiro não encontrado."));
        return new PerfilPassageiroResponse(
                passageiro.getIdPassageiro(), passageiro.getNomeCompleto(), passageiro.getDataNascimento(),
                passageiro.getDocumentoIdentidade(), passageiro.getContatoEmergencia(), passageiro.getNecessidadesEspeciais()
        );
    }

    @Transactional(rollbackFor = Exception.class)
    public MessageResponse atualizarPerfil(Integer idPassageiro, AtualizarPerfilRequest request) throws NotFoundException, BadRequestException {
        Passageiro passageiro = passageiroRepository.findById(idPassageiro)
                .orElseThrow(() -> new NotFoundException("Passageiro não encontrado."));

        boolean algumCampoFornecido = false;
        if (request.getNomeCompleto() != null && !request.getNomeCompleto().isBlank()) {
            passageiro.setNomeCompleto(request.getNomeCompleto().trim());
            algumCampoFornecido = true;
        }
        if (request.getDataNascimento() != null) {
            passageiro.setDataNascimento(request.getDataNascimento());
            algumCampoFornecido = true;
        }
        if (request.getContatoEmergencia() != null) {
            passageiro.setContatoEmergencia(request.getContatoEmergencia().isBlank() ? null : request.getContatoEmergencia().trim());
            algumCampoFornecido = true;
        }
        if (request.getNecessidadesEspeciais() != null) {
            passageiro.setNecessidadesEspeciais(request.getNecessidadesEspeciais());
            algumCampoFornecido = true;
        }

        if (!algumCampoFornecido) {
            throw new BadRequestException("Nenhum campo fornecido para atualização.");
        }

        passageiroRepository.save(passageiro);
        return new MessageResponse("Perfil atualizado com sucesso.");
    }

    @Transactional(rollbackFor = Exception.class)
    public SolicitarPassagemResponse solicitarPassagem(Integer idPassageiro, SolicitarPassagemRequest request) throws BadRequestException, NotFoundException {
        String numVoo = request.getNumVoo();
        String classeCabine = request.getClasseCabine();
        if (!CLASSES_VALIDAS.contains(classeCabine)) {
            throw new BadRequestException("Classe de cabine inválida.");
        }

        Voo voo = vooRepository.findById(numVoo)
                .orElseThrow(() -> new NotFoundException("Voo '" + numVoo + "' não encontrado."));
        if (STATUS_VOO_SEM_RESERVA.contains(voo.getStatusVoo())) {
            throw new BadRequestException("Voo com status '" + voo.getStatusVoo() + "' não aceita reservas.");
        }

        int capacidade = voo.getAeronave().getModelo().getCapacidade();
        long emitidas = destinadoARepository.countByVoo_NumVoo(numVoo);
        if (emitidas >= capacidade) {
            throw new BadRequestException("Voo lotado. Não há assentos disponíveis.");
        }

        Set<String> ocupados = Set.copyOf(passagemRepository.buscarAssentosOcupados(numVoo));
        String assento = alocarAssento(ocupados)
                .orElseThrow(() -> new BadRequestException("Não foi possível alocar um assento."));

        Passageiro passageiro = passageiroRepository.getReferenceById(idPassageiro);
        BigDecimal valorTotal = PRECOS_POR_CLASSE.get(classeCabine);
        String localizador = gerarLocalizador();

        Reserva reserva = reservaRepository.save(Reserva.builder()
                .codigoLocalizador(localizador)
                .dataCriacao(LocalDate.now())
                .statusPagamento("Pendente")
                .valorTotal(valorTotal)
                .agenciaParceira(false)
                .cupomDesconto(false)
                .build());

        Boolean bagagemDespachada = Boolean.TRUE.equals(request.getBagagemDespachada());
        BigDecimal pesoBagagem = bagagemDespachada ? request.getPesoBagagem() : null;

        Passagem passagem = passagemRepository.save(Passagem.builder()
                .classeCabine(classeCabine)
                .assentoPassageiro(assento)
                .passageiro(passageiro)
                .reserva(reserva)
                .bagagemDespachada(bagagemDespachada)
                .pesoBagagem(pesoBagagem)
                .build());

        try {
            destinadoARepository.save(DestinadoA.builder()
                    .id(new DestinadoAId(passagem.getIdPassagem(), numVoo))
                    .passagem(passagem)
                    .voo(voo)
                    .build());
            // Forca o flush para que o trigger trg_valida_capacidade_voo
            // (backstop contra corrida entre o SELECT de emitidas acima e
            // este INSERT) seja capturado aqui, e nao so' no commit.
            destinadoARepository.flush();
        } catch (org.springframework.dao.DataAccessException ex) {
            throw new BadRequestException(com.airlines.company.exception.PostgresMessageExtractor.extract(ex));
        }

        ControleEmbarque controleEmbarque = controleEmbarqueRepository.save(ControleEmbarque.builder()
                .dataHoraPassagemGate(LocalDateTime.now())
                .statusPresencaPassageiro("Ausente")
                .statusAutorizacao("Pendente")
                .voo(voo)
                .passagem(passagem)
                .build());

        return new SolicitarPassagemResponse(
                "Passagem reservada com sucesso!", localizador, assento, classeCabine, numVoo,
                valorTotal, bagagemDespachada, pesoBagagem, controleEmbarque.getIdControleEmbarque()
        );
    }

    private java.util.Optional<String> alocarAssento(Set<String> ocupados) {
        for (int linha = 1; linha < 100; linha++) {
            for (char letra : LETRAS_ASSENTO) {
                String candidato = linha + String.valueOf(letra);
                if (!ocupados.contains(candidato)) {
                    return java.util.Optional.of(candidato);
                }
            }
        }
        return java.util.Optional.empty();
    }

    private String gerarLocalizador() {
        StringBuilder sufixo = new StringBuilder(8);
        for (int i = 0; i < 8; i++) {
            sufixo.append(CARACTERES_LOCALIZADOR.charAt(RANDOM.nextInt(CARACTERES_LOCALIZADOR.length())));
        }
        return "RES-" + sufixo;
    }

    public EmbarquesResponse listarEmbarque(String filtroVoo) {
        List<EmbarqueProjection> embarques = controleEmbarqueRepository.listarEmbarque(filtroVoo);
        return new EmbarquesResponse(embarques, embarques.size());
    }

    public VoosComPresencaResponse resumoEmbarquePorVoo(String filtro) {
        String filtroValido = Set.of("presentes", "embarque_pendente", "pag_pendente").contains(filtro) ? filtro : "presentes";
        List<ResumoEmbarqueProjection> voos = controleEmbarqueRepository.resumoPorVoo(filtroValido);
        return new VoosComPresencaResponse(voos, voos.size(), filtroValido);
    }

    @Transactional(rollbackFor = Exception.class)
    public EmbarqueAcaoResponse autorizarEmbarque(Integer idControle) throws NotFoundException {
        ControleEmbarque controle = controleEmbarqueRepository.findById(idControle)
                .orElseThrow(() -> new NotFoundException("Registro de embarque não encontrado."));

        String statusPagamento = controle.getPassagem().getReserva().getStatusPagamento();

        if ("Pendente".equals(statusPagamento)) {
            controle.setStatusAutorizacao("Negado");
            controle.setMotivoImpedimentoEmbarque("Pagamento não confirmado");
            controleEmbarqueRepository.save(controle);
            return new EmbarqueAcaoResponse("Embarque negado automaticamente: pagamento não confirmado.", idControle, true);
        }

        controle.setStatusAutorizacao("Autorizado");
        controle.setStatusPresencaPassageiro("Presente");
        controleEmbarqueRepository.save(controle);
        return EmbarqueAcaoResponse.of("Embarque autorizado.", idControle);
    }

    @Transactional(rollbackFor = Exception.class)
    public EmbarqueAcaoResponse negarEmbarque(Integer idControle, String motivo) throws NotFoundException {
        ControleEmbarque controle = controleEmbarqueRepository.findById(idControle)
                .orElseThrow(() -> new NotFoundException("Registro de embarque não encontrado."));
        controle.setStatusAutorizacao("Negado");
        controle.setMotivoImpedimentoEmbarque(motivo);
        controleEmbarqueRepository.save(controle);
        return EmbarqueAcaoResponse.of("Embarque negado.", idControle);
    }

    @Transactional(rollbackFor = Exception.class)
    public EmbarqueAcaoResponse confirmarPagamento(Integer idControle) throws BadRequestException, NotFoundException {
        ControleEmbarque controle = controleEmbarqueRepository.findById(idControle)
                .orElseThrow(() -> new NotFoundException("Registro não encontrado ou pagamento já confirmado."));

        Reserva reserva = controle.getPassagem().getReserva();
        if (!"Pendente".equals(reserva.getStatusPagamento())) {
            throw new BadRequestException("Registro não encontrado ou pagamento já confirmado.");
        }

        reserva.setStatusPagamento("Pago");
        reservaRepository.save(reserva);
        return EmbarqueAcaoResponse.of("Pagamento confirmado.", idControle);
    }
}
