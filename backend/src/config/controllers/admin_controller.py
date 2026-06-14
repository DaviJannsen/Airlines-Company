"""
Airlines Company — Controller do Painel Administrativo
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from backend.src.permissions import IsAdmin
from backend.src.services.voo_service import VooService
from backend.src.services.passageiro_service import PassageiroService


class AdminVooListCreateView(APIView):
    """
    GET  /api/admin/voos/     — Lista todos os voos (Admin)
    POST /api/admin/voos/     — Cria um novo voo
    Requer: role='admin' no token JWT.
    """
    permission_classes = [IsAdmin]

    def get(self, request):
        voos = VooService.listar_voos(filtros={})
        return Response({"voos": voos, "total": len(voos)}, status=status.HTTP_200_OK)

    def post(self, request):
        campos_obrigatorios = [
            "num_voo", "tipo_voo", "data_partida",
            "hora_partida", "previsao_chegada", "cod_aeronave",
        ]
        ausentes = [c for c in campos_obrigatorios if not request.data.get(c)]
        if ausentes:
            return Response(
                {"error": f"Campos obrigatórios faltando: {', '.join(ausentes)}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        resultado = VooService.criar_voo(dados=request.data)

        if resultado.get("error"):
            return Response({"error": resultado["error"]}, status=status.HTTP_400_BAD_REQUEST)

        return Response(resultado, status=status.HTTP_201_CREATED)


class AdminPassageiroListView(APIView):
    """
    GET /api/admin/passageiros/
    Lista todos os passageiros registrados.
    Requer: role='admin' no token JWT.
    """
    permission_classes = [IsAdmin]

    def get(self, request):
        busca = request.query_params.get("busca", "")
        passageiros = PassageiroService.listar_passageiros(busca=busca)
        return Response(
            {"passageiros": passageiros, "total": len(passageiros)},
            status=status.HTTP_200_OK,
        )