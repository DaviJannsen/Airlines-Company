"""
Airlines Company — Controller do Painel Administrativo
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

# ─── IMPORTS CORRIGIDOS ───────────────────────────────────────────────────────
from permissions import IsAdmin
from backend.src.config.services.voo_service import VooService
from backend.src.config.services.passageiro_service import PassageiroService
from backend.src.config.services.funcionario_service import FuncionarioService


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


class AeronaveListView(APIView):
    """
    GET  /api/admin/aeronaves/ — Lista aeronaves + modelos disponíveis.
    POST /api/admin/aeronaves/ — Cria nova aeronave.
    """
    permission_classes = [IsAdmin]

    def get(self, request):
        aeronaves = VooService.listar_aeronaves()
        modelos = VooService.listar_modelos_aeronave()
        return Response({"aeronaves": aeronaves, "modelos": modelos}, status=status.HTTP_200_OK)

    def post(self, request):
        resultado = VooService.criar_aeronave(request.data)
        if resultado.get("error"):
            return Response({"error": resultado["error"]}, status=status.HTTP_400_BAD_REQUEST)
        return Response(resultado, status=status.HTTP_201_CREATED)


class ComissaoListView(APIView):
    """GET /api/admin/comissao/ — Lista todos os membros da comissão de bordo."""
    permission_classes = [IsAdmin]

    def get(self, request):
        funcionarios = FuncionarioService.listar_comissao()
        return Response({"funcionarios": funcionarios, "total": len(funcionarios)}, status=status.HTTP_200_OK)


class VooStatusView(APIView):
    """PATCH /api/admin/voos/<num_voo>/status/ — Atualiza o status de um voo."""
    permission_classes = [IsAdmin]

    def patch(self, request, num_voo):
        novo_status = request.data.get("status", "").strip()
        if not novo_status:
            return Response({"error": "Campo 'status' é obrigatório."}, status=status.HTTP_400_BAD_REQUEST)

        resultado = VooService.atualizar_status_voo(num_voo=num_voo, novo_status=novo_status)
        if resultado.get("error"):
            return Response({"error": resultado["error"]}, status=status.HTTP_400_BAD_REQUEST)
        return Response(resultado, status=status.HTTP_200_OK)


class VooDetalhesView(APIView):
    """GET /api/admin/voos/<num_voo>/detalhes/ — Passageiros + escala de tripulação do voo."""
    permission_classes = [IsAdmin]

    def get(self, request, num_voo):
        voo = VooService.buscar_voo_por_numero(num_voo)
        if not voo:
            return Response({"error": "Voo não encontrado."}, status=status.HTTP_404_NOT_FOUND)

        passageiros = FuncionarioService.listar_passageiros_do_voo(num_voo)
        comissao = FuncionarioService.listar_comissao(num_voo=num_voo)

        return Response(
            {"voo": voo, "passageiros": passageiros, "comissao": comissao},
            status=status.HTTP_200_OK,
        )


class EscalaView(APIView):
    """POST /api/admin/voos/<num_voo>/escala/ — Adiciona funcionário à escala."""
    permission_classes = [IsAdmin]

    def post(self, request, num_voo):
        id_funcionario = request.data.get("id_funcionario")
        if not id_funcionario:
            return Response({"error": "Campo 'id_funcionario' é obrigatório."}, status=status.HTTP_400_BAD_REQUEST)
        resultado = FuncionarioService.escalar_funcionario(int(id_funcionario), num_voo)
        if resultado.get("error"):
            return Response({"error": resultado["error"]}, status=status.HTTP_400_BAD_REQUEST)
        return Response(resultado, status=status.HTTP_201_CREATED)


class EscalaRemoverView(APIView):
    """DELETE /api/admin/voos/<num_voo>/escala/<id_funcionario>/ — Remove da escala."""
    permission_classes = [IsAdmin]

    def delete(self, request, num_voo, id_funcionario):
        resultado = FuncionarioService.desescalar_funcionario(int(id_funcionario), num_voo)
        if resultado.get("error"):
            return Response({"error": resultado["error"]}, status=status.HTTP_404_NOT_FOUND)
        return Response(resultado, status=status.HTTP_200_OK)


class EmbarqueListView(APIView):
    """GET /api/admin/embarque/ — Lista registros de controle de embarque."""
    permission_classes = [IsAdmin]

    def get(self, request):
        filtro_voo = request.query_params.get("num_voo")
        embarques = PassageiroService.listar_embarque(filtro_voo=filtro_voo)
        return Response({"embarques": embarques, "total": len(embarques)}, status=status.HTTP_200_OK)


class AutorizarEmbarqueView(APIView):
    """PATCH /api/admin/embarque/<id_controle>/autorizar/"""
    permission_classes = [IsAdmin]

    def patch(self, request, id_controle):
        resultado = PassageiroService.autorizar_embarque(id_controle=id_controle)
        if resultado.get("error"):
            return Response({"error": resultado["error"]}, status=status.HTTP_404_NOT_FOUND)
        return Response(resultado, status=status.HTTP_200_OK)


class NegarEmbarqueView(APIView):
    """PATCH /api/admin/embarque/<id_controle>/negar/"""
    permission_classes = [IsAdmin]

    def patch(self, request, id_controle):
        motivo = request.data.get("motivo", "").strip()
        if not motivo:
            return Response(
                {"error": "O campo 'motivo' é obrigatório para negar o embarque."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        resultado = PassageiroService.negar_embarque(id_controle=id_controle, motivo=motivo)
        if resultado.get("error"):
            return Response({"error": resultado["error"]}, status=status.HTTP_404_NOT_FOUND)
        return Response(resultado, status=status.HTTP_200_OK)