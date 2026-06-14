# permissions.py
from rest_framework.permissions import BasePermission
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.tokens import AccessToken

class JWTPassengerAuthentication(BaseAuthentication):
    """
    Autenticador customizado para ler o token do passageiro sem 
    tentar buscar uma tabela 'auth_user' que não existe no banco.
    """
    def authenticate(self, request):
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return None
        
        try:
            token_str = auth_header.split(' ')[1]
            token = AccessToken(token_str)
            
            class AuthenticatedPassageiro:
                is_authenticated = True
                id_passageiro = token.get("id_passageiro")
                role = token.get("role")
                nome = token.get("nome")
            
            user_obj = AuthenticatedPassageiro()
            return (user_obj, token)
            
        except Exception:
            raise AuthenticationFailed("Token inválido ou expirado.")

class IsPassenger(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user and 
            getattr(request.user, 'is_authenticated', False) and 
            getattr(request.user, 'role', None) == 'passenger'
        )

class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user and 
            getattr(request.user, 'is_authenticated', False) and 
            getattr(request.user, 'role', None) == 'admin'
        )