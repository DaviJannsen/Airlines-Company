import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/axios';

const DOC_TYPES = [
  { prefix: 'CPF-', label: 'CPF (Brasileiro)', placeholder: '12345678901' },
  { prefix: 'PASSPORT-', label: 'Passaporte Internacional', placeholder: 'AA1234567' },
  { prefix: 'DNI-', label: 'DNI', placeholder: '12345678' },
];

const inputCls =
  'w-full border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900 bg-white placeholder:text-slate-400';

export default function Cadastro() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [nomeCompleto, setNomeCompleto] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [nacionalidade, setNacionalidade] = useState('');
  const [docType, setDocType] = useState(DOC_TYPES[0]);
  const [docNumber, setDocNumber] = useState('');
  const [contatoEmergencia, setContatoEmergencia] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const documento = `${docType.prefix}${docNumber.trim()}`;
    setError('');
    setLoading(true);

    try {
      await api.post('/auth/cadastro/', {
        nome_completo: nomeCompleto.trim(),
        data_nascimento: dataNascimento,
        nacionalidade: nacionalidade.trim(),
        documento_identidade: documento,
        contato_emergencia: contatoEmergencia.trim() || undefined,
      });

      const { data } = await api.post('/auth/login/passageiro/', {
        documento_identidade: documento,
        senha: documento,
      });
      login(data);
      navigate('/passageiro');
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao realizar cadastro. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex">
      {/* ── Left branding panel ──────────────────────────────────────── */}
      <div
        className="hidden lg:flex w-5/12 flex-col justify-between p-12 relative overflow-hidden"
        style={{
          background: 'linear-gradient(160deg, #070E1A 0%, #0F2044 55%, #1A3869 100%)',
        }}
      >
        <div className="absolute -top-16 -right-16 w-72 h-72 rounded-full bg-white/5" />
        <div className="absolute -bottom-20 -left-12 w-64 h-64 rounded-full bg-white/5" />

        <div className="relative z-10">
          <div className="text-7xl mb-6">✈</div>
          <h1 className="text-5xl font-black text-white leading-tight mb-3">
            Airlines
            <span className="text-red-400"> Co.</span>
          </h1>
          <p className="text-blue-200 text-lg font-light">Junte-se a milhões de viajantes</p>
        </div>

        <div className="relative z-10 space-y-4">
          {[
            ['✓', 'Acesso ao painel de reservas'],
            ['✓', 'Histórico completo de viagens'],
            ['✓', 'Controle de embarque digital'],
          ].map(([icon, text]) => (
            <div key={text} className="flex items-center gap-3 text-blue-200">
              <span className="text-emerald-400 font-bold">{icon}</span>
              <span className="text-sm">{text}</span>
            </div>
          ))}
          <p className="text-blue-500 text-xs text-center pt-2">
            Sistema de Gestão — UECE · Banco de Dados · TP3
          </p>
        </div>
      </div>

      {/* ── Right form panel ─────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col justify-center items-center p-8 bg-slate-50 overflow-y-auto">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-slate-800">Criar Conta de Passageiro</h2>
            <p className="text-slate-400 text-sm mt-1">
              Preencha seus dados para se cadastrar
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  value={nomeCompleto}
                  onChange={(e) => setNomeCompleto(e.target.value)}
                  placeholder="Ex: Ana Carolina Ferreira"
                  required
                  className={inputCls}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                    Data de Nascimento *
                  </label>
                  <input
                    type="date"
                    value={dataNascimento}
                    onChange={(e) => setDataNascimento(e.target.value)}
                    required
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                    Nacionalidade *
                  </label>
                  <input
                    type="text"
                    value={nacionalidade}
                    onChange={(e) => setNacionalidade(e.target.value)}
                    placeholder="Ex: Brasileira"
                    required
                    className={inputCls}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                  Tipo de Documento *
                </label>
                <select
                  value={docType.prefix}
                  onChange={(e) =>
                    setDocType(DOC_TYPES.find((d) => d.prefix === e.target.value))
                  }
                  className={inputCls + ' bg-white cursor-pointer'}
                >
                  {DOC_TYPES.map((d) => (
                    <option key={d.prefix} value={d.prefix}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                  Número do Documento *
                </label>
                <div className="flex rounded-xl overflow-hidden border border-slate-200 focus-within:ring-2 focus-within:ring-blue-900 transition-all">
                  <span className="bg-slate-50 border-r border-slate-200 px-3 flex items-center text-slate-500 text-xs font-mono shrink-0">
                    {docType.prefix}
                  </span>
                  <input
                    type="text"
                    value={docNumber}
                    onChange={(e) => {
                      const raw = e.target.value;
                      setDocNumber(
                        docType.prefix === 'CPF-'
                          ? raw.replace(/\D/g, '').slice(0, 11)
                          : raw
                      );
                    }}
                    placeholder={docType.placeholder}
                    required
                    inputMode={docType.prefix === 'CPF-' ? 'numeric' : 'text'}
                    className="flex-1 px-3 py-3 text-slate-800 text-sm focus:outline-none"
                  />
                </div>
                <p className="text-xs text-slate-400 mt-1.5">
                  💡 O documento será usado como senha de acesso.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                  Contato de Emergência
                </label>
                <input
                  type="text"
                  value={contatoEmergencia}
                  onChange={(e) => setContatoEmergencia(e.target.value)}
                  placeholder="Ex: +55 11 99999-0000"
                  className={inputCls}
                />
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
                {loading ? 'Cadastrando e entrando...' : 'Criar conta e entrar →'}
              </button>
            </form>
          </div>

          <p className="text-center mt-5 text-sm text-slate-400">
            Já tem conta?{' '}
            <Link to="/login" className="text-blue-700 hover:underline font-medium">
              Entrar
            </Link>
            {' · '}
            <Link to="/" className="text-blue-700 hover:underline">
              ← Voltar para voos
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
