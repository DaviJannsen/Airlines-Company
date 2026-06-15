"""
Airlines Company — Controller do Painel do Passageiro
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

# Importa a permissão e o novo autenticador da raiz
from permissions import IsPassenger, JWTPassengerAuthentication
from backend.src.config.services.passageiro_service import PassageiroService


class SolicitarPassagemView(APIView):
    """
    POST /api/passageiro/reservar/
    Cria Reserva + Passagem + Destinado_A + Controle_Embarque em uma transação.
    """
    authentication_classes = [JWTPassengerAuthentication]
    permission_classes = [IsPassenger]

    def post(self, request):
        id_passageiro = request.user.id_passageiro
        resultado = PassageiroService.solicitar_passagem(
            id_passageiro=id_passageiro, dados=request.data
        )
        if resultado.get("error"):
            return Response({"error": resultado["error"]}, status=status.HTTP_400_BAD_REQUEST)
        return Response(resultado, status=status.HTTP_201_CREATED)


class MinhasReservasView(APIView):
    """
    GET /api/passageiro/reservas/
    Retorna todas as reservas do passageiro autenticado usando o token JWT.
    """
    authentication_classes = [JWTPassengerAuthentication]
    permission_classes = [IsPassenger]

    def get(self, request):
        # Agora o ID vem seguro e dinâmico direto do token descriptografado!
        id_passageiro = request.user.id_passageiro

        reservas = PassageiroService.listar_reservas_passageiro(
            id_passageiro=id_passageiro
        )
        return Response({"reservas": reservas}, status=status.HTTP_200_OK)