# permissions.py
from rest_framework.permissions import BasePermission

class IsPassenger(BasePermission):
    """
    Permite acesso apenas a usuários autenticados com a role 'passenger'.
    """
    def has_permission(self, request, view):
        # Verifica se o usuário existe, está autenticado e possui a role correta
        return (
            request.user and 
            request.user.is_authenticated and 
            getattr(request.user, 'role', None) == 'passenger'
        )

class IsAdmin(BasePermission):
    """
    Permite acesso apenas a usuários autenticados com a role 'admin'.
    """
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            getattr(request.user, 'role', None) == 'admin'
        )