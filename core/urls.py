"""
Airlines Company — Roteamento Central de URLs
"""
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    # Django Admin nativo (acelerador para gestão de solo)
    path("admin/", admin.site.urls),

    # API Principal v1
    path("api/", include("backend.urls")),
]

# Customização do Django Admin
admin.site.site_header = "Airlines Company — Painel de Controle"
admin.site.site_title = "Airlines Admin"
admin.site.index_title = "Gestão Operacional"