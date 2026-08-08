package com.airlines.company.service;

import com.airlines.company.database.model.Passageiro;
import com.airlines.company.database.model.Usuario;
import com.airlines.company.database.repository.IPassageiroRepository;
import com.airlines.company.database.repository.IUsuarioRepository;
import com.airlines.company.dto.request.AdminSetupRequest;
import com.airlines.company.dto.request.CadastroPassageiroRequest;
import com.airlines.company.dto.response.AdminSetupCheckResponse;
import com.airlines.company.dto.response.CadastroPassageiroResponse;
import com.airlines.company.dto.response.LoginResponse;
import com.airlines.company.exception.BadRequestException;
import com.airlines.company.exception.ConflictException;
import com.airlines.company.exception.UnauthorizedException;
import com.airlines.company.security.JwtService;
import io.jsonwebtoken.Claims;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.Map;

/**
 * Autenticacao JWT com hash de senha real (BCrypt), substituindo:
 *  - a comparacao em texto puro documento==senha do Passageiro original;
 *  - a dependencia do auth_user nativo do Django para Admin (agora Usuario).
 */
@Service
@RequiredArgsConstructor
public class AuthService {

    private static final String[] PREFIXOS_DOCUMENTO_PASSAGEIRO = {"CPF-", "PASSPORT-", "DNI-"};

    private final IUsuarioRepository usuarioRepository;
    private final IPassageiroRepository passageiroRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    /**
     * Endpoint "inteligente" de login (POST /auth/login/passageiro/ no
     * contrato original): decide entre fluxo de admin ou passageiro a partir
     * do prefixo do documento informado.
     */
    public LoginResponse loginUnificado(String documento, String senha) throws UnauthorizedException {
        boolean ehPassageiro = java.util.Arrays.stream(PREFIXOS_DOCUMENTO_PASSAGEIRO).anyMatch(documento::startsWith);
        return ehPassageiro ? loginPassageiro(documento, senha) : loginAdmin(documento, senha);
    }

    public LoginResponse loginAdmin(String username, String senha) throws UnauthorizedException {
        Usuario usuario = usuarioRepository.findByUsername(username)
                .orElseThrow(() -> new UnauthorizedException("Credenciais inválidas."));

        if (!passwordEncoder.matches(senha, usuario.getSenhaHash())) {
            throw new UnauthorizedException("Credenciais inválidas.");
        }

        Map<String, Object> claims = new HashMap<>();
        claims.put("role", "ADMIN");
        claims.put("nome", usuario.getNomeCompleto());

        String access = jwtService.generateAccessToken(usuario.getUsername(), claims);
        String refresh = jwtService.generateRefreshToken(usuario.getUsername(), claims);

        return new LoginResponse(access, refresh, "admin", usuario.getNomeCompleto());
    }

    public LoginResponse loginPassageiro(String documento, String senha) throws UnauthorizedException {
        Passageiro passageiro = passageiroRepository.findByDocumentoIdentidade(documento)
                .orElseThrow(() -> new UnauthorizedException("Passageiro não encontrado com este documento."));

        if (!passwordEncoder.matches(senha, passageiro.getSenhaHash())) {
            throw new UnauthorizedException("Credenciais inválidas.");
        }

        Map<String, Object> claims = new HashMap<>();
        claims.put("role", "PASSENGER");
        claims.put("nome", passageiro.getNomeCompleto());
        claims.put("id_passageiro", passageiro.getIdPassageiro());

        String subject = "passageiro_" + passageiro.getIdPassageiro();
        String access = jwtService.generateAccessToken(subject, claims);
        String refresh = jwtService.generateRefreshToken(subject, claims);

        return new LoginResponse(access, refresh, "passenger", passageiro.getNomeCompleto());
    }

    public LoginResponse refresh(String refreshToken) throws UnauthorizedException {
        if (!jwtService.isValid(refreshToken)) {
            throw new UnauthorizedException("Refresh token inválido ou expirado.");
        }

        Claims claims = jwtService.parseClaims(refreshToken);
        if (!"refresh".equals(claims.get("tokenType", String.class))) {
            throw new UnauthorizedException("Token informado não é um refresh token.");
        }

        Map<String, Object> novasClaims = new HashMap<>();
        novasClaims.put("role", claims.get("role"));
        novasClaims.put("nome", claims.get("nome"));
        if (claims.get("id_passageiro") != null) {
            novasClaims.put("id_passageiro", claims.get("id_passageiro"));
        }

        String access = jwtService.generateAccessToken(claims.getSubject(), novasClaims);
        String role = claims.get("role", String.class);
        String nome = claims.get("nome", String.class);

        return new LoginResponse(access, refreshToken, "ADMIN".equals(role) ? "admin" : "passenger", nome);
    }

    @Transactional(rollbackFor = Exception.class)
    public CadastroPassageiroResponse cadastrarPassageiro(CadastroPassageiroRequest request) throws BadRequestException {
        String documento = request.getDocumentoIdentidade();
        boolean prefixoValido = java.util.Arrays.stream(PREFIXOS_DOCUMENTO_PASSAGEIRO).anyMatch(documento::startsWith);
        if (!prefixoValido) {
            throw new BadRequestException("Documento deve iniciar com CPF-, PASSPORT- ou DNI-.");
        }
        if (passageiroRepository.existsByDocumentoIdentidade(documento)) {
            throw new BadRequestException("Já existe um cadastro com este documento de identidade.");
        }

        Passageiro passageiro = passageiroRepository.save(Passageiro.builder()
                .nomeCompleto(request.getNomeCompleto())
                .dataNascimento(request.getDataNascimento())
                .nacionalidade(request.getNacionalidade())
                .documentoIdentidade(documento)
                .contatoEmergencia(request.getContatoEmergencia())
                .necessidadesEspeciais(false)
                .senhaHash(passwordEncoder.encode(request.getSenha()))
                .build());

        return new CadastroPassageiroResponse(
                "Cadastro realizado com sucesso!",
                passageiro.getIdPassageiro(),
                passageiro.getDocumentoIdentidade(),
                passageiro.getNomeCompleto()
        );
    }

    public AdminSetupCheckResponse verificarSetup() {
        return new AdminSetupCheckResponse(usuarioRepository.existsBySuperAdminTrue());
    }

    @Transactional(rollbackFor = Exception.class)
    public void criarPrimeiroAdmin(AdminSetupRequest request) throws ConflictException {
        if (usuarioRepository.existsBySuperAdminTrue()) {
            throw new ConflictException("Setup bloqueado: já existe um administrador cadastrado.");
        }

        usuarioRepository.save(Usuario.builder()
                .username(request.getUsername())
                .senhaHash(passwordEncoder.encode(request.getSenha()))
                .nomeCompleto(request.getNome())
                .email(request.getEmail())
                .superAdmin(true)
                .build());
    }
}
