"""
Airlines Company — Controller do Painel Administrativo
"""
from django.contrib.auth.models import User
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny

from permissions import IsAdmin
from backend.src.config.services.voo_service import VooService
from backend.src.config.services.passageiro_service import PassageiroService
from backend.src.config.services.funcionario_service import FuncionarioService


class AdminSetupCheckView(APIView):
    """
    GET /api/admin/check-setup/
    Verifica se já existe um superusuário cadastrado no sistema.
    Sem autenticação — usado pela tela de setup inicial.
    """
    authentication_classes = []
    permission_classes = [AllowAny]

    def get(self, request):
        has_admin = User.objects.filter(is_superuser=True).exists()
        return Response({"has_admin": has_admin}, status=status.HTTP_200_OK)


class AdminSetupView(APIView):
    """
    POST /api/admin/setup/
    Cria o primeiro administrador do sistema (superusuário Django).
    Bloqueado automaticamente após a criação do primeiro admin.
    """
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        if User.objects.filter(is_superuser=True).exists():
            return Response(
                {"error": "Setup bloqueado: já existe um administrador cadastrado."},
                status=status.HTTP_403_FORBIDDEN,
            )

        nome     = request.data.get("nome", "").strip()
        username = request.data.get("username", "").strip()
        email    = request.data.get("email", "").strip()
        senha    = request.data.get("senha", "")

        if not all([nome, username, email, senha]):
            return Response(
                {"error": "Todos os campos são obrigatórios."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if len(senha) < 8:
            return Response(
                {"error": "A senha deve ter no mínimo 8 caracteres."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            partes = nome.split(" ", 1)
            User.objects.create_superuser(
                username=username,
                email=email,
                password=senha,
                first_name=partes[0],
                last_name=partes[1] if len(partes) > 1 else "",
            )
            return Response(
                {"message": "Administrador criado com sucesso."},
                status=status.HTTP_201_CREATED,
            )
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class AdminVooListCreateView(APIView):
    """
    GET  /api/admin/voos/     — Lista todos os voos (Admin)
    POST /api/admin/voos/     — Cria um novo voo
    Requer: role='admin' no token JWT.
    """
    permission_classes = [IsAdmin]

    def get(self, request):
        busca = request.query_params.get("busca", "").strip()
        filtros = {"busca": busca} if busca else {}
        voos = VooService.listar_voos(filtros=filtros)
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
        busca = request.query_params.get("busca", "")
        funcionarios = FuncionarioService.listar_comissao(busca=busca)
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


class VoosComPresencaView(APIView):
    """
    GET /api/admin/embarque/voos-com-presenca/?filtro=<opcao>
    Agrega controle_embarque por voo com GROUP BY + HAVING.
    filtro: presentes | embarque_pendente | pag_pendente
    """
    permission_classes = [IsAdmin]

    def get(self, request):
        filtro = request.query_params.get("filtro", "presentes")
        voos = PassageiroService.resumo_embarque_por_voo(filtro=filtro)
        return Response({"voos": voos, "total": len(voos), "filtro": filtro}, status=status.HTTP_200_OK)


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


class ConfirmarPagamentoView(APIView):
    """PATCH /api/admin/embarque/<id_controle>/confirmar-pagamento/"""
    permission_classes = [IsAdmin]

    def patch(self, _request, id_controle):
        resultado = PassageiroService.confirmar_pagamento(id_controle=id_controle)
        if resultado.get("error"):
            return Response({"error": resultado["error"]}, status=status.HTTP_400_BAD_REQUEST)
        return Response(resultado, status=status.HTTP_200_OK)


class ModeloAeronaveCreateView(APIView):
    """POST /api/admin/modelos-aeronave/ — Cria novo modelo de aeronave."""
    permission_classes = [IsAdmin]

    def post(self, request):
        resultado = VooService.criar_modelo_aeronave(request.data)
        if resultado.get("error"):
            return Response({"error": resultado["error"]}, status=status.HTTP_400_BAD_REQUEST)
        return Response(resultado, status=status.HTTP_201_CREATED)


class FuncionarioCreateView(APIView):
    """POST /api/admin/funcionarios/ — Cadastra piloto ou comissário."""
    permission_classes = [IsAdmin]

    def post(self, request):
        resultado = FuncionarioService.criar_funcionario(request.data)
        if resultado.get("error"):
            return Response({"error": resultado["error"]}, status=status.HTTP_400_BAD_REQUEST)
        return Response(resultado, status=status.HTTP_201_CREATED)


class FuncionarioUpdateView(APIView):
    """PATCH /api/admin/funcionarios/<id_funcionario>/ — Atualiza dados de um funcionário."""
    permission_classes = [IsAdmin]

    def patch(self, _request, id_funcionario):
        resultado = FuncionarioService.atualizar_funcionario(
            id_funcionario=id_funcionario, dados=_request.data
        )
        if resultado.get("error"):
            return Response({"error": resultado["error"]}, status=status.HTTP_400_BAD_REQUEST)
        return Response(resultado, status=status.HTTP_200_OK)

    def delete(self, request, id_funcionario):
        resultado = FuncionarioService.deletar_funcionario(id_funcionario=id_funcionario)
        if resultado.get("error"):
            return Response({"error": resultado["error"]}, status=status.HTTP_400_BAD_REQUEST)
        return Response(resultado, status=status.HTTP_200_OK)