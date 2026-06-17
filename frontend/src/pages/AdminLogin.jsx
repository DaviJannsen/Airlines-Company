import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/axios';

export default function AdminLogin() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user?.role === 'admin') navigate('/admin/dashboard', { replace: true });
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login/admin/', {
        username: username.trim(),
        senha: password,
      });
      login(data);
      navigate('/admin/dashboard', { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Credenciais inválidas.');
    } finally {
      setLoading(false);
    }
  };

  const inputCls = 'w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all';

  return (
    <div className="min-h-screen flex" style={{ background: '#070E1A' }}>
      {/* Painel esquerdo */}
      <div className="hidden lg:flex w-5/12 flex-col justify-between p-14 border-r border-white/5 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-blue-900/20" />
          <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-blue-900/10" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <span className="text-3xl">✈</span>
            <div>
              <p className="font-extrabold text-xl text-white tracking-tight">
                Airlines<span className="text-red-400"> Co.</span>
              </p>
              <p className="text-blue-400 text-xs">Backoffice Administrativo</p>
            </div>
          </div>
          <div className="mb-6">
            <span className="text-xs font-bold text-blue-400 uppercase tracking-widest bg-blue-400/10 px-3 py-1 rounded-full">
              Acesso Restrito
            </span>
          </div>
          <h1 className="text-4xl font-black text-white leading-tight mb-4">
            Painel de<br />Operações
          </h1>
          <p className="text-blue-300 text-sm leading-relaxed">
            Área exclusiva para administradores do sistema.
            Gerencie voos, tripulação, passageiros e controle de embarque.
          </p>
        </div>
        <div className="relative z-10 space-y-3">
          {[
            { icon: '✈', text: 'Gestão completa de voos e status' },
            { icon: '👥', text: 'Escalas de tripulação e passageiros' },
            { icon: '🚪', text: 'Controle de embarque em tempo real' },
          ].map(({ icon, text }) => (
            <div key={text} className="flex items-center gap-3 text-blue-300 text-xs">
              <span className="text-base">{icon}</span>
              <span>{text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Painel direito — login */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-10 justify-center">
            <span className="text-2xl">✈</span>
            <p className="font-extrabold text-xl text-white">
              Airlines<span className="text-red-400"> Co.</span>
            </p>
          </div>

          <div className="mb-8">
            <div className="w-12 h-12 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center mb-4">
              <span className="text-xl">🔐</span>
            </div>
            <h2 className="text-2xl font-bold text-white mb-1">Acesso Administrativo</h2>
            <p className="text-blue-300/70 text-sm">Entre com suas credenciais de backoffice.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-blue-300 uppercase tracking-widest mb-1.5">
                Username do Sistema
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="usuario.admin"
                required
                autoComplete="username"
                className={inputCls}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-blue-300 uppercase tracking-widest mb-1.5">
                Senha
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
                className={inputCls}
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-300 text-sm rounded-xl px-4 py-3">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3.5 rounded-xl font-semibold text-sm transition-colors"
            >
              {loading ? 'Autenticando...' : 'Entrar no Painel →'}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-white/5 text-center space-y-2">
            <Link to="/" className="block text-xs text-blue-400/50 hover:text-blue-300 transition-colors">
              ← Voltar para o portal do passageiro
            </Link>
            <p className="text-xs text-white/10">
              Airlines Co. — UECE · Banco de Dados · TP3
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
