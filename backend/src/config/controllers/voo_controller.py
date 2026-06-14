# backend/src/config/controllers/voo_controller.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from backend.src.config.services.voo_service import VooService


class VooListView(APIView):
    """Controlador para listar todos os voos disponíveis com filtros opcionais."""

    def get(self, request):
        # Pega as variáveis de filtro passadas na URL (Ex: ?origem=FOR&destino=GRU)
        filtros = {
            "origem": request.query_params.get("origem"),
            "destino": request.query_params.get("destino"),
            "data": request.query_params.get("data"),
            "tipo_voo": request.query_params.get("tipo_voo"),
        }

        # Chama o método que está no arquivo que você me mandou
        voos = VooService.listar_voos(filtros)
        return Response(voos, status=status.HTTP_200_OK)


class VooDetailView(APIView):
    """Controlador para ver detalhes de um voo específico pelo seu código."""

    def get(self, request, num_voo):
        # Chama o buscador por número do seu arquivo de Service
        voo = VooService.buscar_voo_por_numero(num_voo)

        if not voo:
            return Response(
                {"error": "Voo não encontrado ou inexistente."},
                status=status.HTTP_404_NOT_FOUND,
            )

        return Response(voo, status=status.HTTP_200_OK)