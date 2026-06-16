"""
Airlines Company — Roteamento da API
Prefixo: /api/
"""
from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from backend.src.config.controllers.auth_controller import (
    PassageiroLoginView,
    AdminLoginView,
    CadastroPassageiroView,
)
from backend.src.config.controllers.voo_controller import (
    VooListView,
    VooDetailView,
)
from backend.src.config.controllers.passageiro_controller import (
    MinhasReservasView,
    MeuPerfilView,
    SolicitarPassagemView,
)
from backend.src.config.controllers.admin_controller import (
    AdminSetupCheckView,
    AdminSetupView,
    AdminVooListCreateView,
    AdminPassageiroListView,
    AeronaveListView,
    ComissaoListView,
    VooStatusView,
    VooDetalhesView,
    EscalaView,
    EscalaRemoverView,
    EmbarqueListView,
    VoosComPresencaView,
    AutorizarEmbarqueView,
    NegarEmbarqueView,
    ConfirmarPagamentoView,
    ModeloAeronaveCreateView,
    FuncionarioCreateView,
    FuncionarioUpdateView,
)

urlpatterns = [
    # ── Autenticação ───────────────────────────────────────────────────────────
    path("auth/login/passageiro/", PassageiroLoginView.as_view(),    name="login-passageiro"),
    path("auth/login/admin/",      AdminLoginView.as_view(),         name="login-admin"),
    path("auth/cadastro/",         CadastroPassageiroView.as_view(), name="cadastro-passageiro"),
    path("auth/refresh/",          TokenRefreshView.as_view(),       name="token-refresh"),

    # ── Público ────────────────────────────────────────────────────────────────
    path("voos/",               VooListView.as_view(),   name="voo-list"),
    path("voos/<str:num_voo>/", VooDetailView.as_view(), name="voo-detail"),

    # ── Passageiro (role: passenger) ───────────────────────────────────────────
    path("passageiro/reservas/", MinhasReservasView.as_view(),    name="minhas-reservas"),
    path("passageiro/reservar/", SolicitarPassagemView.as_view(), name="reservar"),
    path("passageiro/perfil/",   MeuPerfilView.as_view(),         name="meu-perfil"),

    # ── Setup inicial (sem autenticação — bloqueado após primeiro admin) ────────
    path("admin/check-setup/", AdminSetupCheckView.as_view(), name="admin-check-setup"),
    path("admin/setup/",       AdminSetupView.as_view(),      name="admin-setup"),

    # ── Admin (role: admin) ────────────────────────────────────────────────────
    path("admin/voos/",        AdminVooListCreateView.as_view(),  name="admin-voo-list"),
    path("admin/passageiros/", AdminPassageiroListView.as_view(), name="admin-passageiros"),
    path("admin/aeronaves/",   AeronaveListView.as_view(),        name="admin-aeronaves"),
    path("admin/comissao/",    ComissaoListView.as_view(),         name="admin-comissao"),

    # Detalhes e escala de tripulação por voo
    path("admin/voos/<str:num_voo>/status/",
         VooStatusView.as_view(), name="admin-voo-status"),
    path("admin/voos/<str:num_voo>/detalhes/",
         VooDetalhesView.as_view(), name="admin-voo-detalhes"),
    path("admin/voos/<str:num_voo>/escala/",
         EscalaView.as_view(), name="admin-escala-create"),
    path("admin/voos/<str:num_voo>/escala/<int:id_funcionario>/",
         EscalaRemoverView.as_view(), name="admin-escala-remove"),

    # Controle de Embarque
    path("admin/embarque/",                        EmbarqueListView.as_view(),      name="embarque-list"),
    path("admin/embarque/voos-com-presenca/",      VoosComPresencaView.as_view(),   name="embarque-voos-com-presenca"),
    path("admin/embarque/<int:id_controle>/autorizar/",
         AutorizarEmbarqueView.as_view(), name="embarque-autorizar"),
    path("admin/embarque/<int:id_controle>/negar/",
         NegarEmbarqueView.as_view(), name="embarque-negar"),
    path("admin/embarque/<int:id_controle>/confirmar-pagamento/",
         ConfirmarPagamentoView.as_view(), name="embarque-confirmar-pagamento"),

    # Modelos de Aeronave e Funcionários
    path("admin/modelos-aeronave/",                  ModeloAeronaveCreateView.as_view(), name="admin-modelos-aeronave"),
    path("admin/funcionarios/",                      FuncionarioCreateView.as_view(),    name="admin-funcionarios"),
    path("admin/funcionarios/<int:id_funcionario>/", FuncionarioUpdateView.as_view(),    name="admin-funcionario-update"),
]
