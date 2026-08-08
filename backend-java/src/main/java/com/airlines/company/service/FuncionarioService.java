package com.airlines.company.service;

import com.airlines.company.database.model.*;
import com.airlines.company.database.repository.*;
import com.airlines.company.dto.projection.ComissaoProjection;
import com.airlines.company.dto.projection.PassageiroVooProjection;
import com.airlines.company.dto.request.AtualizarFuncionarioRequest;
import com.airlines.company.dto.request.CriarFuncionarioRequest;
import com.airlines.company.dto.request.IdiomaVinculoRequest;
import com.airlines.company.dto.response.*;
import com.airlines.company.exception.BadRequestException;
import com.airlines.company.exception.BusinessRuleException;
import com.airlines.company.exception.NotFoundException;
import com.airlines.company.exception.PostgresMessageExtractor;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataAccessException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class FuncionarioService {

    private final IComissaoDeBordoRepository comissaoDeBordoRepository;
    private final IPilotoRepository pilotoRepository;
    private final IComissarioRepository comissarioRepository;
    private final IIdiomaRepository idiomaRepository;
    private final IFuncionarioIdiomaRepository funcionarioIdiomaRepository;
    private final IEscalaTrabalhoRepository escalaTrabalhoRepository;
    private final ITrechoRepository trechoRepository;
    private final IVooRepository vooRepository;
    private final IPassagemRepository passagemRepository;
    private final ObjectMapper objectMapper;

    public ComissaoResponse listarComissao(String numVoo, String busca) {
        List<ComissaoProjection> linhas = comissaoDeBordoRepository.listarComissao(numVoo, busca);
        List<ComissaoItemResponse> itens = linhas.stream().map(this::toItemResponse).toList();
        return new ComissaoResponse(itens, itens.size());
    }

    private ComissaoItemResponse toItemResponse(ComissaoProjection p) {
        return new ComissaoItemResponse(
                p.getIdFuncionario(), p.getNomeCompleto(), p.getCpf(), p.getDataAdmissao(), p.getSalarioBase(),
                p.getCargo(), p.getLicencaPiloto(), p.getValidadeCertificado(), p.getEscaladoNesteVoo(),
                p.getTotalVoos(), parseIdiomas(p.getIdiomasJson())
        );
    }

    private List<IdiomaVinculoResponse> parseIdiomas(String idiomasJson) {
        if (idiomasJson == null || idiomasJson.isBlank()) {
            return List.of();
        }
        try {
            return objectMapper.readValue(idiomasJson, objectMapper.getTypeFactory()
                    .constructCollectionType(List.class, IdiomaVinculoResponse.class));
        } catch (JsonProcessingException e) {
            return List.of();
        }
    }

    public IdiomasResponse listarIdiomas() {
        List<IdiomaResponse> idiomas = idiomaRepository.findAllByOrderByNomeAsc().stream()
                .map(i -> new IdiomaResponse(i.getCodIdioma(), i.getNome()))
                .toList();
        return new IdiomasResponse(idiomas);
    }

    public List<PassageiroVooProjection> listarPassageirosDoVoo(String numVoo) {
        return passagemRepository.listarPassageirosDoVoo(numVoo);
    }

    @Transactional(rollbackFor = Exception.class)
    public EscalaResponse escalarFuncionario(Integer idFuncionario, String numVoo) throws BadRequestException {
        Trecho trecho = trechoRepository.findFirstByVoo_NumVooOrderByCodigoTrechoAsc(numVoo)
                .orElseThrow(() -> new BadRequestException("Voo '" + numVoo + "' não possui trecho cadastrado."));

        if (escalaTrabalhoRepository.existsByFuncionario_IdFuncionarioAndVoo_NumVoo(idFuncionario, numVoo)) {
            throw new BadRequestException("Funcionário já está escalado para este voo.");
        }

        ComissaoDeBordo funcionario = comissaoDeBordoRepository.getReferenceById(idFuncionario);
        Voo voo = vooRepository.getReferenceById(numVoo);
        Aeroporto aeroporto = trecho.getAeroportoOrigem();

        escalaTrabalhoRepository.save(EscalaTrabalho.builder()
                .id(new EscalaTrabalhoId(idFuncionario, numVoo, aeroporto.getCodigoIata()))
                .funcionario(funcionario)
                .voo(voo)
                .aeroporto(aeroporto)
                .build());

        return new EscalaResponse("Funcionário escalado com sucesso.", idFuncionario, numVoo);
    }

    @Transactional(rollbackFor = Exception.class)
    public EscalaResponse desescalarFuncionario(Integer idFuncionario, String numVoo) throws NotFoundException {
        EscalaTrabalho escala = escalaTrabalhoRepository.findByFuncionario_IdFuncionarioAndVoo_NumVoo(idFuncionario, numVoo)
                .orElseThrow(() -> new NotFoundException("Escalação não encontrada."));
        escalaTrabalhoRepository.delete(escala);
        return new EscalaResponse("Funcionário removido da escala.", idFuncionario, numVoo);
    }

    @Transactional(rollbackFor = Exception.class)
    public FuncionarioAtualizadoResponse atualizarFuncionario(Integer idFuncionario, AtualizarFuncionarioRequest request)
            throws NotFoundException, BusinessRuleException {
        ComissaoDeBordo funcionario = comissaoDeBordoRepository.findById(idFuncionario)
                .orElseThrow(() -> new NotFoundException("Funcionário não encontrado."));

        try {
            if (request.getNomeCompleto() != null && !request.getNomeCompleto().isBlank()) {
                funcionario.setNomeCompleto(request.getNomeCompleto().trim());
            }
            if (request.getSalarioBase() != null) {
                funcionario.setSalarioBase(request.getSalarioBase());
            }
            comissaoDeBordoRepository.save(funcionario);

            if (request.getLicencaPiloto() != null || request.getValidadeHabilitacao() != null) {
                pilotoRepository.findById(idFuncionario).ifPresent(piloto -> {
                    if (request.getLicencaPiloto() != null && !request.getLicencaPiloto().isBlank()) {
                        piloto.setLicencaPiloto(request.getLicencaPiloto().trim());
                    }
                    if (request.getValidadeHabilitacao() != null) {
                        piloto.setValidadeHabilitacao(request.getValidadeHabilitacao());
                    }
                    pilotoRepository.save(piloto);
                });
            }

            if (request.getValidadeCertificado() != null) {
                comissarioRepository.findById(idFuncionario).ifPresent(comissario -> {
                    comissario.setValidadeCertificado(request.getValidadeCertificado());
                    comissarioRepository.save(comissario);
                });
            }

            if (request.getIdiomas() != null) {
                substituirIdiomas(funcionario, request.getIdiomas());
            }

            // Ver comentario em criarFuncionario: forca o INSERT/UPDATE a
            // acontecer agora para que o trigger de validade seja capturado
            // por este catch, em vez de estourar so' no commit da transacao.
            comissaoDeBordoRepository.flush();
        } catch (DataAccessException ex) {
            throw new BusinessRuleException(PostgresMessageExtractor.extract(ex));
        }

        return new FuncionarioAtualizadoResponse("Funcionário atualizado com sucesso.", idFuncionario);
    }

    private void substituirIdiomas(ComissaoDeBordo funcionario, List<IdiomaVinculoRequest> idiomas) {
        funcionarioIdiomaRepository.deleteByFuncionario_IdFuncionario(funcionario.getIdFuncionario());
        for (IdiomaVinculoRequest item : idiomas) {
            if (item.getCodIdioma() == null) {
                continue;
            }
            Idioma idioma = idiomaRepository.getReferenceById(item.getCodIdioma());
            funcionarioIdiomaRepository.save(FuncionarioIdioma.builder()
                    .id(new FuncionarioIdiomaId(funcionario.getIdFuncionario(), item.getCodIdioma()))
                    .funcionario(funcionario)
                    .idioma(idioma)
                    .nivelFluencia(item.getNivelFluencia() != null ? item.getNivelFluencia() : "Nativo")
                    .build());
        }
    }

    @Transactional(rollbackFor = Exception.class)
    public MessageResponse deletarFuncionario(Integer idFuncionario) throws BadRequestException, NotFoundException, BusinessRuleException {
        long totalEscalas = escalaTrabalhoRepository.countByFuncionario_IdFuncionario(idFuncionario);
        if (totalEscalas > 0) {
            throw new BadRequestException(
                    "Funcionário possui " + totalEscalas + " voo(s) escalado(s). Remova das escalas antes de excluir.");
        }

        ComissaoDeBordo funcionario = comissaoDeBordoRepository.findById(idFuncionario)
                .orElseThrow(() -> new NotFoundException("Funcionário não encontrado."));

        try {
            comissaoDeBordoRepository.delete(funcionario);
            comissaoDeBordoRepository.flush();
        } catch (DataAccessException ex) {
            throw new BusinessRuleException(PostgresMessageExtractor.extract(ex));
        }

        return new MessageResponse("Funcionário excluído com sucesso.");
    }

    @Transactional(rollbackFor = Exception.class)
    public FuncionarioCriadoResponse criarFuncionario(CriarFuncionarioRequest request) throws BadRequestException, BusinessRuleException {
        String cargo = request.getCargo();
        if (!"Piloto".equals(cargo) && !"Comissário".equals(cargo)) {
            throw new BadRequestException("Cargo deve ser 'Piloto' ou 'Comissário'.");
        }

        String cpf = request.getCpf() != null ? request.getCpf().replaceAll("\\D", "") : "";
        BigDecimal salarioBase = request.getSalarioBase();
        if (request.getNomeCompleto() == null || request.getNomeCompleto().isBlank()
                || cpf.isBlank() || request.getDataAdmissao() == null || salarioBase == null) {
            throw new BadRequestException("Nome, CPF, data de admissão e salário são obrigatórios.");
        }
        if (!cpf.matches("^\\d{11}$")) {
            throw new BadRequestException("CPF deve conter exatamente 11 dígitos numéricos.");
        }
        if (salarioBase.signum() <= 0) {
            throw new BadRequestException("Salário deve ser maior que zero.");
        }

        boolean ehPiloto = "Piloto".equals(cargo);
        if (ehPiloto) {
            if (request.getLicencaPiloto() == null || request.getLicencaPiloto().isBlank() || request.getValidadeHabilitacao() == null) {
                throw new BadRequestException("Licença e validade de habilitação são obrigatórias para Piloto.");
            }
        } else if (request.getValidadeCertificado() == null) {
            throw new BadRequestException("Validade do certificado é obrigatória para Comissário.");
        }

        if (comissaoDeBordoRepository.existsByCpf(cpf)) {
            throw new BadRequestException("CPF '" + cpf + "' já está cadastrado.");
        }

        try {
            ComissaoDeBordo funcionario = comissaoDeBordoRepository.save(ComissaoDeBordo.builder()
                    .cpf(cpf)
                    .nomeCompleto(request.getNomeCompleto().trim())
                    .dataAdmissao(request.getDataAdmissao())
                    .salarioBase(salarioBase)
                    .build());

            if (ehPiloto) {
                pilotoRepository.save(Piloto.builder()
                        .comissaoDeBordo(funcionario)
                        .licencaPiloto(request.getLicencaPiloto().trim())
                        .validadeHabilitacao(request.getValidadeHabilitacao())
                        .build());
            } else {
                comissarioRepository.save(Comissario.builder()
                        .comissaoDeBordo(funcionario)
                        .validadeCertificado(request.getValidadeCertificado())
                        .build());
                if (request.getIdiomas() != null) {
                    substituirIdiomas(funcionario, request.getIdiomas());
                }
            }

            // Forca o flush aqui dentro do try: Piloto/Comissario nao tem
            // geracao IDENTITY, entao o INSERT so seria emitido no commit da
            // transacao (fora deste catch) sem este flush explicito - e e'
            // exatamente o INSERT que os triggers de validade interceptam.
            comissaoDeBordoRepository.flush();

            return new FuncionarioCriadoResponse(funcionario.getIdFuncionario(), funcionario.getNomeCompleto(), cargo,
                    cargo + " cadastrado com sucesso.");
        } catch (DataAccessException ex) {
            throw new BusinessRuleException(PostgresMessageExtractor.extract(ex));
        }
    }
}
