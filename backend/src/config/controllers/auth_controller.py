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

# ─── IMPORTS CORRIGIDOS ───────────────────────────────────────────────────────
from backend.src.config.services.auth_services import AuthService


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
    Body: { "documento_identidade": "...", "senha": "..." }
    """
    permission_classes = [AllowAny]

    def post(self, request):
        document = request.data.get("documento_identidade")
        senha = request.data.get("senha")

        if not document or not senha:
            return Response(
                {"error": "Os campos 'documento_identidade' e 'senha' são obrigatórios."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        result = AuthService.login_passageiro(documento=document, senha=senha)

        if result.get("error"):
            return Response({"error": result["error"]}, status=status.HTTP_41_UNAUTHORIZED)

        return Response(result, status=status.HTTP_200_OK)


class AdminLoginView(APIView):
    """
    POST /api/auth/login/admin/
    Body: { "username": "...", "senha": "..." }
    """
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