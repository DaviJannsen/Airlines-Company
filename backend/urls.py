"""
Airlines Company — Roteamento da API
Prefixo: /api/
"""
from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from backend.src.config.controllers.auth_controller import (
    PassageiroLoginView,
    AdminLoginView,
)
from backend.src.config.controllers.voo_controller import (
    VooListView,
    VooDetailView,
)
from backend.src.config.controllers.passageiro_controller import (
    MinhasReservasView,
)
from backend.src.config.controllers.admin_controller import (
    AdminVooListCreateView,
    AdminPassageiroListView,
)

urlpatterns = [
    # ── Autenticação ───────────────────────────────────────────────────────────
    path("auth/login/passageiro/", PassageiroLoginView.as_view(),  name="login-passageiro"),
    path("auth/login/admin/",      AdminLoginView.as_view(),       name="login-admin"),
    path("auth/refresh/",          TokenRefreshView.as_view(),     name="token-refresh"),

    # ── Público ────────────────────────────────────────────────────────────────
    path("voos/",               VooListView.as_view(),          name="voo-list"),
    path("voos/<str:num_voo>/", VooDetailView.as_view(),        name="voo-detail"),

    # ── Passageiro (role: passenger) ───────────────────────────────────────────
    path("passageiro/reservas/", MinhasReservasView.as_view(),  name="minhas-reservas"),

    # ── Admin (role: admin) ────────────────────────────────────────────────────
    path("admin/voos/",          AdminVooListCreateView.as_view(), name="admin-voo-list"),
    path("admin/passageiros/",   AdminPassageiroListView.as_view(), name="admin-passageiros"),
]