import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

export default function AdminSetup() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [form, setForm] = useState({ nome: '', username: '', email: '', senha: '', confirmar: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    api.get('/admin/check-setup/')
      .then(({ data }) => {
        if (data.has_admin) navigate('/admin/login', { replace: true });
        else setChecking(false);
      })
      .catch(() => setChecking(false));
  }, [navigate]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.senha !== form.confirmar) {
      setError('As senhas não coincidem.');
      return;
    }
    if (form.senha.length < 8) {
      setError('A senha deve ter no mínimo 8 caracteres.');
      return;
    }
    setLoading(true);
    try {
      await api.post('/admin/setup/', {
        nome: form.nome,
        username: form.username,
        email: form.email,
        senha: form.senha,
      });
      setDone(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao criar administrador.');
    } finally {
      setLoading(false);
    }
  };

  const inputCls = 'w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all';
  const labelCls = 'block text-xs font-semibold text-blue-300 uppercase tracking-widest mb-1.5';

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#070E1A' }}>
        <div className="text-center">
          <div className="text-5xl animate-bounce mb-4">✈</div>
          <p className="text-blue-300 text-sm">Verificando estado do sistema...</p>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: '#070E1A' }}>
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">✓</span>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Sistema Inicializado</h2>
          <p className="text-blue-300 text-sm mb-8">
            Administrador criado com sucesso. Esta rota de configuração está permanentemente bloqueada.
          </p>
          <button
            onClick={() => navigate('/admin/login')}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-semibold text-sm transition-colors"
          >
            Ir para o Login Administrativo →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex" style={{ background: '#070E1A' }}>
      {/* Painel esquerdo — contexto */}
      <div className="hidden lg:flex w-5/12 flex-col justify-between p-14 border-r border-white/5 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-blue-900/20" />
          <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-blue-900/10" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <span className="text-3xl">✈</span>
            <div>
              <p className="font-extrabold text-xl text-white tracking-tight">Airlines<span className="text-red-400"> Co.</span></p>
              <p className="text-blue-400 text-xs">Sistema de Gestão</p>
            </div>
          </div>
          <div className="space-y-2 mb-8">
            <span className="text-xs font-bold text-blue-400 uppercase tracking-widest bg-blue-400/10 px-3 py-1 rounded-full">
              Configuração Inicial
            </span>
          </div>
          <h1 className="text-4xl font-black text-white leading-tight mb-4">
            Inicializar<br />o Sistema
          </h1>
          <p className="text-blue-300 text-sm leading-relaxed">
            Esta é uma rota secreta de uso exclusivo do administrador de TI.
            Após a criação do primeiro administrador, esta página será bloqueada permanentemente.
          </p>
        </div>
        <div className="relative z-10 space-y-3">
          {[
            { icon: '🔒', text: 'Rota bloqueada após o primeiro uso' },
            { icon: '🛡️', text: 'Acesso ao Backoffice criado com segurança' },
            { icon: '⚡', text: 'Setup único — sem confirmação de e-mail' },
          ].map(({ icon, text }) => (
            <div key={text} className="flex items-center gap-3 text-blue-300 text-xs">
              <span className="text-base">{icon}</span>
              <span>{text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Painel direito — formulário */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-1">Criar Administrador Geral</h2>
            <p className="text-blue-300/70 text-sm">
              Preencha os dados do responsável técnico pelo sistema.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className={labelCls}>Nome Completo</label>
              <input type="text" value={form.nome} onChange={(e) => set('nome', e.target.value)}
                placeholder="Ex: João Silva" required className={inputCls} />
            </div>

            <div>
              <label className={labelCls}>Username do Sistema</label>
              <input type="text" value={form.username} onChange={(e) => set('username', e.target.value)}
                placeholder="Ex: joao.silva" required className={inputCls} autoComplete="username" />
              <p className="text-xs text-blue-400/60 mt-1">Será usado para fazer login no painel.</p>
            </div>

            <div>
              <label className={labelCls}>E-mail</label>
              <input type="email" value={form.email} onChange={(e) => set('email', e.target.value)}
                placeholder="admin@airlines.com" required className={inputCls} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Senha</label>
                <input type="password" value={form.senha} onChange={(e) => set('senha', e.target.value)}
                  placeholder="Mín. 8 caracteres" required className={inputCls} autoComplete="new-password" />
              </div>
              <div>
                <label className={labelCls}>Confirmar Senha</label>
                <input type="password" value={form.confirmar} onChange={(e) => set('confirmar', e.target.value)}
                  placeholder="Repita a senha" required className={inputCls} autoComplete="new-password" />
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-300 text-sm rounded-xl px-4 py-3">
                {error}
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3.5 rounded-xl font-semibold text-sm transition-colors mt-2">
              {loading ? 'Criando administrador...' : 'Inicializar Sistema →'}
            </button>
          </form>

          <p className="text-center mt-6 text-xs text-blue-400/40">
            Airlines Co. — UECE · Banco de Dados · TP3
          </p>
        </div>
      </div>
    </div>
  );
}
