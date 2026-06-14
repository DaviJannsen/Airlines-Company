"""
Airlines Company — Controller do Painel do Passageiro
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

# ─── IMPORTS CORRIGIDOS ───────────────────────────────────────────────────────
from permissions import IsPassenger
from backend.src.config.services.passageiro_service import PassageiroService


class MinhasReservasView(APIView):
    """
    GET /api/passageiro/reservas/
    Retorna todas as reservas do passageiro autenticado.
    Requer: role='passenger' no token JWT.
    """
    permission_classes = [IsPassenger]

    def get(self, request):
        # O id_passageiro vem do token JWT (injetado pelo AuthService)
        id_passageiro = request.user.id_passageiro

        reservas = PassageiroService.listar_reservas_passageiro(
            id_passageiro=id_passageiro
        )
        return Response({"reservas": reservas}, status=status.HTTP_200_OK)