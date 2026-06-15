import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/axios';

const DOC_TYPES = [
  { prefix: 'CPF-',      label: 'CPF (Brasileiro)',            placeholder: '12345678901' },
  { prefix: 'PASSPORT-', label: 'Passaporte Internacional',    placeholder: 'AA1234567'   },
  { prefix: 'DNI-',      label: 'DNI',                         placeholder: '12345678'    },
];

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [docType, setDocType]   = useState(DOC_TYPES[0]);
  const [docNumber, setDocNumber] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!docNumber.trim()) return;
    setError('');
    setLoading(true);
    const documento = `${docType.prefix}${docNumber.trim()}`;
    try {
      const { data } = await api.post('/auth/login/passageiro/', {
        documento_identidade: documento,
        senha: documento,
      });
      login(data);
      navigate('/passageiro');
    } catch (err) {
      setError(
        err.response?.data?.error ||
        'Documento não encontrado. Verifique o tipo e o número.'
      );
    } finally {
      setLoading(false);
    }
  };

  const inputCls =
    'w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-transparent transition-all placeholder:text-slate-400';

  return (
    <div className="min-h-[calc(100vh-64px)] flex">
      {/* ── Painel esquerdo ──────────────────────────────────────────────── */}
      <div
        className="hidden lg:flex w-5/12 flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: 'linear-gradient(160deg, #070E1A 0%, #0F2044 55%, #1A3869 100%)' }}
      >
        <div className="absolute -top-16 -right-16 w-72 h-72 rounded-full bg-white/5" />
        <div className="absolute -bottom-20 -left-12 w-64 h-64 rounded-full bg-white/5" />

        <div className="relative z-10">
          <div className="text-7xl mb-6">✈</div>
          <h1 className="text-5xl font-black text-white leading-tight mb-3">
            Airlines<span className="text-red-400"> Co.</span>
          </h1>
          <p className="text-blue-200 text-lg font-light">Conectando pessoas ao mundo</p>
        </div>

        <div className="relative z-10 space-y-6">
          <div className="grid grid-cols-3 gap-3">
            {[
              { n: '150+', l: 'Destinos'    },
              { n: '2M+',  l: 'Passageiros' },
              { n: '99%',  l: 'Pontualidade'},
            ].map((s) => (
              <div key={s.l} className="bg-white/10 border border-white/10 rounded-2xl p-3 text-center">
                <p className="text-white font-extrabold text-xl">{s.n}</p>
                <p className="text-blue-300 text-xs mt-0.5">{s.l}</p>
              </div>
            ))}
          </div>
          <p className="text-blue-500 text-xs text-center">
            Sistema de Gestão — UECE · Banco de Dados · TP3
          </p>
        </div>
      </div>

      {/* ── Painel direito — formulário ───────────────────────────────────── */}
      <div className="flex-1 flex flex-col justify-center items-center p-8 bg-slate-50">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-slate-800">Área do Passageiro</h2>
            <p className="text-slate-400 text-sm mt-1">
              Acesse com seu documento de identidade
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                  Tipo de Documento
                </label>
                <select
                  value={docType.prefix}
                  onChange={(e) => setDocType(DOC_TYPES.find((d) => d.prefix === e.target.value))}
                  className={inputCls + ' bg-white cursor-pointer'}
                >
                  {DOC_TYPES.map((d) => (
                    <option key={d.prefix} value={d.prefix}>{d.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                  Número do Documento
                </label>
                <div className="flex rounded-xl overflow-hidden border border-slate-200 focus-within:ring-2 focus-within:ring-blue-900 transition-all">
                  <span className="bg-slate-50 border-r border-slate-200 px-3 flex items-center text-slate-500 text-xs font-mono shrink-0">
                    {docType.prefix}
                  </span>
                  <input
                    type="text"
                    value={docNumber}
                    onChange={(e) => setDocNumber(e.target.value)}
                    placeholder={docType.placeholder}
                    required
                    className="flex-1 px-3 py-3 text-slate-800 text-sm focus:outline-none"
                  />
                </div>
                <p className="text-xs text-slate-400 mt-1.5">
                  Para passageiros, a senha é o próprio documento de identidade.
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-100 text-red-700 text-sm rounded-xl p-3.5">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed text-white py-3.5 rounded-xl font-semibold transition-colors"
              >
                {loading ? 'Autenticando...' : 'Entrar →'}
              </button>

              <p className="text-center text-sm text-slate-400 pt-1">
                Não tem conta?{' '}
                <Link to="/cadastro" className="text-blue-700 hover:underline font-medium">
                  Cadastre-se aqui
                </Link>
              </p>
            </form>
          </div>

          <p className="text-center mt-5 text-sm text-slate-400">
            <Link to="/" className="text-blue-700 hover:underline">← Voltar para busca de voos</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
