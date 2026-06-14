# backend/src/services/auth_service.py
from django.db import connection
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken


class AuthService:

    @staticmethod
    def login_passageiro(documento: str, senha: str) -> dict:
        """
        Autentica o Passageiro comparando o documento com a senha.
        Fiel ao modelo físico do TP3 (Sem campo de senha hash).
        """
        # Regra acadêmica: A senha digitada deve ser igual ao documento (CPF/Passaporte)
        if documento != senha:
            return {"error": "Credenciais inválidas. Para passageiros, digite seu documento no campo de senha."}

        # Busca se o passageiro realmente existe no banco do Supabase
        sql = """
            SELECT id_passageiro, nome_completo
            FROM airline.Passageiro
            WHERE documento_identidade = %s 
            LIMIT 1;
        """
        with connection.cursor() as cursor:
            cursor.execute(sql, [documento])
            row = cursor.fetchone()

        if not row:
            return {"error": "Passageiro não encontrado com este documento."}

        id_passageiro, nome_completo = row

        # Gera o token JWT para o React gerenciar a sessão do passageiro
        from backend.src.config.services.auth_services import _PassageiroUser
        user_obj = _PassageiroUser(
            id=id_passageiro,
            nome=nome_completo,
            role="passenger",
            id_passageiro=id_passageiro,
        )
        refresh = RefreshToken.for_user(user_obj)
        refresh["role"] = "passenger"
        refresh["nome"] = nome_completo
        refresh["id_passageiro"] = id_passageiro

        return {
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "role": "passenger",
            "nome": nome_completo,
        }

    @staticmethod
    def login_admin(username: str, senha: str) -> dict:
        """Autentica Funcionários/ADM usando a tabela nativa auth_user do Django."""
        user = authenticate(username=username, password=senha)

        if not user:
            return {"error": "Credenciais inválidas."}

        if not user.is_active:
            return {"error": "Conta inativa. Contate o administrador."}

        # Verifica se está associado à tabela comissao_de_bordo
        sql = """
            SELECT cb.id_funcionario, cb.nome_completo
            FROM airline.Comissao_De_Bordo cb
            WHERE cb.cpf = %s 
            LIMIT 1;
        """
        # Nota: assume-se que o username criado no Django Admin seja o CPF do funcionário
        with connection.cursor() as cursor:
            cursor.execute(sql, [user.username])
            row = cursor.fetchone()

        if not row and not user.is_superuser:
            return {"error": "Usuário do Django não tem um funcionário correspondente no modelo físico."}

        tokens = AuthService._gerar_tokens_admin(user=user)
        return {
            "access": tokens["access"],
            "refresh": tokens["refresh"],
            "role": "admin",
            "nome": user.get_full_name() or user.username,
        }

    @staticmethod
    def _gerar_tokens_admin(user) -> dict:
        refresh = RefreshToken.for_user(user)
        refresh["role"] = "admin"
        refresh["nome"] = user.get_full_name() or user.username
        return {
            "access": str(refresh.access_token),
            "refresh": str(refresh),
        }


class _PassageiroUser:
    is_active = True
    is_anonymous = False
    is_authenticated = True
    pk = None

    def __init__(self, id: int, nome: str, role: str, id_passageiro: int):
        self.pk = id
        self.id = id
        self.nome = nome
        self.role = role
        self.id_passageiro = id_passageiro
        self.username = f"passageiro_{id}"