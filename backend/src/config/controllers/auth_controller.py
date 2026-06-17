"""
Airlines Company — Controller de Autenticação
─────────────────────────────────────────────
Responsabilidade: receber a requisição HTTP, validar campos básicos
                  e delegar a lógica ao AuthService.

NÃO contém regras de negócio — apenas orquestra entrada/saída HTTP.
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from backend.src.config.services.auth_services import AuthService
from backend.src.config.services.passageiro_service import PassageiroService


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Adiciona o claim 'role' ao payload do token JWT."""

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token["role"] = getattr(user, "role", "passenger")
        token["nome"] = user.get_full_name() or user.username
        return token

class PassageiroLoginView(APIView):
    """
    POST /api/auth/login/
    Endpoint único inteligente que decide se faz login de passageiro ou admin.
    """
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        document = request.data.get("documento_identidade")
        senha = request.data.get("senha")

        if not document or not senha:
            return Response(
                {"error": "Os campos 'documento_identidade' e 'senha' são obrigatórios."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        # Se NÃO contiver os prefixos de passageiro, trata o login como ADMIN
        if not (document.startswith("CPF-") or document.startswith("PASSPORT-") or document.startswith("DNI-")):
            result = AuthService.login_admin(username=document, senha=senha)
        else:
            # Se tiver os prefixos, segue o fluxo normal do passageiro 
            result = AuthService.login_passageiro(documento=document, senha=senha)

        # Trata as respostas de erro unificadas
        if result.get("error"):
            return Response({"error": result["error"]}, status=status.HTTP_401_UNAUTHORIZED)

        return Response(result, status=status.HTTP_200_OK)


class AdminLoginView(APIView):
    """
    POST /api/auth/login/admin/
    Body: { "username": "...", "senha": "..." }
    """
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get("username")
        senha = request.data.get("senha")

        if not username or not senha:
            return Response(
                {"error": "Os campos 'username' e 'senha' são obrigatórios."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        result = AuthService.login_admin(username=username, senha=senha)

        if result.get("error"):
            return Response({"error": result["error"]}, status=status.HTTP_401_UNAUTHORIZED)

        return Response(result, status=status.HTTP_200_OK)


class CadastroPassageiroView(APIView):
    """
    POST /api/auth/cadastro/
    Registra um novo passageiro na tabela airline.passageiro.
    Body: { nome_completo, data_nascimento, nacionalidade, documento_identidade, contato_emergencia? }
    """
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        resultado = PassageiroService.cadastrar_passageiro(dados=request.data)
        if resultado.get("error"):
            return Response({"error": resultado["error"]}, status=status.HTTP_400_BAD_REQUEST)
        return Response(resultado, status=status.HTTP_201_CREATED)