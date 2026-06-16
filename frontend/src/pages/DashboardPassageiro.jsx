import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/axios';

// ── Status styles ─────────────────────────────────────────────────────────────
const PAYMENT_STYLE = {
  Pago: 'bg-emerald-100 text-emerald-700',
  Pendente: 'bg-amber-100 text-amber-700',
  Cancelado: 'bg-red-100 text-red-700',
  Reembolsado: 'bg-purple-100 text-purple-700',
};

const VOO_STATUS_STYLE = {
  Programado: 'bg-blue-100 text-blue-700',
  'Em Voo': 'bg-emerald-100 text-emerald-700',
  Concluído: 'bg-slate-100 text-slate-500',
  Cancelado: 'bg-red-100 text-red-700',
  Atrasado: 'bg-amber-100 text-amber-700',
};

const PRESENCA_STYLE = {
  Presente: { cls: 'bg-emerald-100 text-emerald-700', icon: '✅' },
  Ausente: { cls: 'bg-red-100 text-red-700', icon: '❌' },
  'Em Espera': { cls: 'bg-amber-100 text-amber-700', icon: '⏳' },
};

const CLASSE_ICON = {
  Econômica: '🪑',
  Executiva: '💺',
  'Primeira Classe': '👑',
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmtDate(s) {
  if (!s) return '—';
  return new Date(s + 'T00:00:00').toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function fmtTime(s) {
  return s ? s.slice(0, 5) : '—';
}

function fmtCurrency(v) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(v || 0);
}

// ── ReservaCard ───────────────────────────────────────────────────────────────
function ReservaCard({ r }) {
  const presenca = PRESENCA_STYLE[r.status_presenca_passageiro] || PRESENCA_STYLE['Em Espera'];
  const chegada = r.previsao_chegada
    ? new Date(r.previsao_chegada).toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
      })
    : '—';

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow flex flex-col">
      {/* Dark header with route */}
      <div
        className="p-5 text-white"
        style={{
          background: 'linear-gradient(135deg, #070E1A 0%, #0F2044 70%, #1A3869 100%)',
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <span className="font-mono text-xs font-bold bg-white/15 border border-white/20 px-2.5 py-1 rounded-lg">
            {r.num_voo}
          </span>
          <span
            className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
              VOO_STATUS_STYLE[r.status_voo] || 'bg-white/20 text-white'
            }`}
          >
            {r.status_voo}
          </span>
        </div>
        <div className="flex items-center">
          <div className="flex-1">
            <p className="text-2xl font-extrabold leading-none">{r.cidade_origem}</p>
            <p className="text-blue-200 text-sm mt-1">{fmtTime(r.hora_partida)}</p>
          </div>
          <div className="flex-shrink-0 text-blue-300 text-xl px-4 self-center">✈</div>
          <div className="flex-1 text-right">
            <p className="text-2xl font-extrabold leading-none">{r.cidade_destino}</p>
            <p className="text-blue-200 text-sm mt-1">{chegada}</p>
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="p-5 flex-1 space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-xs text-slate-400 font-medium">Localizador</span>
          <span className="font-mono font-bold text-slate-700 text-sm">
            {r.codigo_localizador}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs text-slate-400 font-medium">Data do Voo</span>
          <span className="text-sm text-slate-700">{fmtDate(r.data_partida)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs text-slate-400 font-medium">Pagamento</span>
          <span
            className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
              PAYMENT_STYLE[r.status_pagamento] || 'bg-slate-100 text-slate-600'
            }`}
          >
            {r.status_pagamento}
          </span>
        </div>

        <div className="border-t border-slate-100 pt-3 grid grid-cols-2 gap-x-4 gap-y-3">
          <div>
            <p className="text-xs text-slate-400">Assento</p>
            <p className="text-xl font-black text-slate-800 leading-tight">
              {r.assento_passageiro}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Classe</p>
            <p className="text-sm font-semibold text-slate-700">
              {CLASSE_ICON[r.classe_cabine]} {r.classe_cabine}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Bagagem</p>
            <p className="text-sm text-slate-600">
              {r.bagagem_despachada
                ? `✓ ${r.peso_bagagem ? r.peso_bagagem + ' kg' : 'Despachada'}`
                : '✗ Não despachada'}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Valor Total</p>
            <p className="text-sm font-bold text-slate-800">{fmtCurrency(r.valor_total)}</p>
          </div>
        </div>
      </div>

      {/* Gate status footer */}
      <div className="px-5 pb-5">
        <div className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500">🚪 Status no Gate</span>
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${presenca.cls}`}>
            {presenca.icon} {r.status_presenca_passageiro || 'Em Espera'}
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Constantes de Reserva ─────────────────────────────────────────────────────
const CABIN_CLASSES = [
  { key: 'Econômica', icon: '🪑', preco: 850, desc: 'Conforto essencial para sua viagem' },
  { key: 'Executiva', icon: '💺', preco: 2500, desc: 'Mais espaço e serviço premium' },
  { key: 'Primeira Classe', icon: '👑', preco: 8000, desc: 'Experiência exclusiva de luxo' },
];

const VOO_DISPONIVEL = (v) =>
  !['Cancelado', 'Concluído'].includes(v.status_voo) && (v.assentos_restantes ?? 1) > 0;

// ── Modal de Reserva Multi-step ───────────────────────────────────────────────
function ReservarModal({ onClose, onSuccess }) {
  const [step, setStep] = useState('flight-select'); // flight-select | class-select | confirm | loading | success | error
  const [voos, setVoos] = useState([]);
  const [voosLoading, setVoosLoading] = useState(true);
  const [selectedVoo, setSelectedVoo] = useState(null);
  const [selectedClass, setSelectedClass] = useState(null);
  const [resultado, setResultado] = useState(null);
  const [erroModal, setErroModal] = useState('');

  useEffect(() => {
    api.get('/voos/').then(({ data }) => {
      setVoos((Array.isArray(data) ? data : []).filter(VOO_DISPONIVEL));
    }).catch(() => {}).finally(() => setVoosLoading(false));
  }, []);

  const handleConfirmar = async () => {
    setStep('loading');
    try {
      const { data } = await api.post('/passageiro/reservar/', {
        num_voo: selectedVoo.num_voo,
        classe_cabine: selectedClass,
      });
      setResultado(data);
      setStep('success');
    } catch (err) {
      setErroModal(err.response?.data?.error || 'Erro ao processar reserva.');
      setStep('error');
    }
  };

  const handleSuccess = () => {
    onSuccess();
    onClose();
  };

  const fmtR = (v) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div
          className="px-8 py-6 rounded-t-3xl text-white flex items-center justify-between shrink-0"
          style={{ background: 'linear-gradient(135deg, #070E1A 0%, #0F2044 100%)' }}
        >
          <div>
            <h3 className="text-xl font-bold">
              {step === 'flight-select' && '1. Escolha o Voo'}
              {step === 'class-select' && '2. Classe de Cabine'}
              {step === 'confirm' && '3. Confirmar Reserva'}
              {step === 'loading' && 'Processando...'}
              {step === 'success' && 'Reserva Confirmada!'}
              {step === 'error' && 'Erro na Reserva'}
            </h3>
            {step === 'flight-select' && (
              <p className="text-blue-300 text-xs mt-0.5">{voos.length} voos disponíveis</p>
            )}
          </div>
          {!['loading'].includes(step) && (
            <button
              onClick={onClose}
              className="text-white/60 hover:text-white text-2xl leading-none transition-colors"
            >
              ×
            </button>
          )}
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-6">

          {/* ── Step 1: flight-select ── */}
          {step === 'flight-select' && (
            voosLoading ? (
              <div className="space-y-3">
                {[1,2,3].map(i => (
                  <div key={i} className="h-20 bg-slate-100 rounded-2xl animate-pulse" />
                ))}
              </div>
            ) : voos.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <p className="text-4xl mb-3">✈</p>
                <p>Nenhum voo disponível no momento.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {voos.map((v) => (
                  <button
                    key={v.num_voo}
                    onClick={() => { setSelectedVoo(v); setStep('class-select'); }}
                    className="w-full text-left border border-slate-200 rounded-2xl p-4 hover:border-blue-900 hover:bg-blue-50/30 transition-all group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <span className="font-mono text-xs font-bold bg-slate-100 text-slate-500 px-2 py-1 rounded-lg group-hover:bg-blue-100 group-hover:text-blue-700 transition-colors">
                          {v.num_voo}
                        </span>
                        <div>
                          <p className="font-bold text-slate-800">
                            {v.cidade_origem} <span className="text-slate-400 font-normal">→</span> {v.cidade_destino}
                          </p>
                          <p className="text-xs text-slate-400">
                            {fmtDate(v.data_partida)} · {fmtTime(v.hora_partida)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0 ml-4">
                        {(v.assentos_restantes ?? 99) <= 10 ? (
                          <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
                            ⚡ {v.assentos_restantes} restantes
                          </span>
                        ) : (
                          <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                            ✓ {v.assentos_restantes ?? '—'} livres
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )
          )}

          {/* ── Step 2: class-select ── */}
          {step === 'class-select' && selectedVoo && (
            <div className="space-y-4">
              <div className="bg-slate-50 rounded-2xl p-4 text-sm text-slate-600 mb-2">
                <span className="font-mono text-xs font-bold bg-slate-200 text-slate-600 px-2 py-0.5 rounded mr-2">
                  {selectedVoo.num_voo}
                </span>
                {selectedVoo.cidade_origem} → {selectedVoo.cidade_destino} ·{' '}
                {fmtDate(selectedVoo.data_partida)}
              </div>

              {CABIN_CLASSES.map((cls) => (
                <button
                  key={cls.key}
                  onClick={() => { setSelectedClass(cls.key); setStep('confirm'); }}
                  className="w-full text-left border border-slate-200 rounded-2xl p-5 hover:border-blue-900 hover:bg-blue-50/30 transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{cls.icon}</span>
                      <div>
                        <p className="font-bold text-slate-800">{cls.key}</p>
                        <p className="text-xs text-slate-400">{cls.desc}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-extrabold text-lg text-slate-800 group-hover:text-blue-900">
                        {fmtR(cls.preco)}
                      </p>
                      <p className="text-xs text-slate-400">por pessoa</p>
                    </div>
                  </div>
                </button>
              ))}

              <button
                onClick={() => setStep('flight-select')}
                className="text-slate-400 hover:text-slate-600 text-sm w-full text-center pt-2 transition-colors"
              >
                ← Voltar para voos
              </button>
            </div>
          )}

          {/* ── Step 3: confirm ── */}
          {step === 'confirm' && selectedVoo && selectedClass && (
            <div className="space-y-5">
              <div
                className="rounded-2xl p-6 text-white"
                style={{ background: 'linear-gradient(135deg, #070E1A 0%, #0F2044 100%)' }}
              >
                <div className="flex justify-between items-start mb-4">
                  <span className="font-mono text-xs bg-white/15 px-2 py-1 rounded-lg">
                    {selectedVoo.num_voo}
                  </span>
                  <span className="text-xs bg-white/10 px-2 py-1 rounded-full">
                    {selectedVoo.tipo_voo}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-3xl font-black">{selectedVoo.iata_origem}</p>
                    <p className="text-blue-200 text-sm">{selectedVoo.cidade_origem}</p>
                    <p className="text-white font-bold mt-1">{fmtTime(selectedVoo.hora_partida)}</p>
                  </div>
                  <span className="text-blue-300 text-2xl">✈</span>
                  <div className="text-right">
                    <p className="text-3xl font-black">{selectedVoo.iata_destino}</p>
                    <p className="text-blue-200 text-sm">{selectedVoo.cidade_destino}</p>
                    <p className="text-blue-300 text-sm mt-1">{fmtDate(selectedVoo.data_partida)}</p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 rounded-2xl p-5 space-y-3 text-sm">
                {[
                  ['Classe de Cabine', `${CABIN_CLASSES.find(c => c.key === selectedClass)?.icon} ${selectedClass}`],
                  ['Assento', 'Será atribuído automaticamente'],
                  ['Status de Pagamento', 'Pendente (pague no balcão)'],
                  ['Valor Total', fmtR(CABIN_CLASSES.find(c => c.key === selectedClass)?.preco)],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between items-center">
                    <span className="text-slate-400">{label}</span>
                    <span className="font-semibold text-slate-800">{value}</span>
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep('class-select')}
                  className="flex-1 border border-slate-200 text-slate-600 hover:bg-slate-50 py-3.5 rounded-xl font-semibold transition-colors"
                >
                  ← Voltar
                </button>
                <button
                  onClick={handleConfirmar}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3.5 rounded-xl font-semibold transition-colors"
                >
                  Confirmar Reserva
                </button>
              </div>
            </div>
          )}

          {/* ── Step: loading ── */}
          {step === 'loading' && (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-900 rounded-full animate-spin" />
              <p className="text-slate-500 text-sm">Criando sua reserva no banco de dados...</p>
            </div>
          )}

          {/* ── Step: success ── */}
          {step === 'success' && resultado && (
            <div className="text-center py-4">
              <div className="text-6xl mb-4">🎉</div>
              <h4 className="text-xl font-bold text-slate-800 mb-1">Reserva Confirmada!</h4>
              <p className="text-slate-400 text-sm mb-6">Sua passagem foi gerada com sucesso.</p>

              <div className="bg-slate-50 rounded-2xl p-6 text-left space-y-3 mb-6">
                {[
                  ['Localizador', resultado.codigo_localizador],
                  ['Voo', resultado.num_voo],
                  ['Assento', resultado.assento],
                  ['Classe', resultado.classe_cabine],
                  ['Valor Total', fmtR(resultado.valor_total)],
                  ['Status de Embarque', 'Ausente (aguardando gate)'],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between items-center text-sm">
                    <span className="text-slate-400">{label}</span>
                    <span className="font-bold text-slate-800 font-mono">{value}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={handleSuccess}
                className="w-full text-white py-3.5 rounded-2xl font-semibold hover:opacity-90 transition-opacity"
                style={{ backgroundColor: '#0F2044' }}
              >
                Ver Minhas Reservas
              </button>
            </div>
          )}

          {/* ── Step: error ── */}
          {step === 'error' && (
            <div className="text-center py-8">
              <div className="text-5xl mb-4">⚠️</div>
              <h4 className="text-lg font-bold text-slate-800 mb-2">Não foi possível reservar</h4>
              <p className="text-red-600 text-sm bg-red-50 rounded-xl p-3 mb-6">{erroModal}</p>
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 border border-slate-200 text-slate-600 hover:bg-slate-50 py-3 rounded-xl font-semibold transition-colors"
                >
                  Fechar
                </button>
                <button
                  onClick={() => { setStep('flight-select'); setErroModal(''); }}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-semibold transition-colors"
                >
                  Tentar novamente
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── EditarPerfilModal ─────────────────────────────────────────────────────────
function EditarPerfilModal({ onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [fetchingPerfil, setFetchingPerfil] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    nome_completo: '',
    data_nascimento: '',
    contato_emergencia: '',
    necessidades_especiais: '',
  });

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    api.get('/passageiro/perfil/')
      .then(({ data }) => {
        setForm({
          nome_completo: data.nome_completo || '',
          data_nascimento: data.data_nascimento || '',
          contato_emergencia: data.contato_emergencia || '',
          necessidades_especiais: data.necessidades_especiais || '',
        });
      })
      .catch(() => setError('Não foi possível carregar os dados do perfil.'))
      .finally(() => setFetchingPerfil(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.patch('/passageiro/perfil/', form);
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao atualizar perfil.');
    } finally {
      setLoading(false);
    }
  };

  const inputCls = 'w-full border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900 bg-white';
  const labelCls = 'block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5';

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden max-h-[95vh] flex flex-col">
        <div className="px-7 py-5 text-white flex items-center justify-between shrink-0"
          style={{ background: 'linear-gradient(135deg, #070E1A 0%, #0F2044 100%)' }}>
          <div>
            <h3 className="text-lg font-bold">Editar Perfil</h3>
            <p className="text-blue-300 text-xs mt-0.5">Documento de identidade não pode ser alterado</p>
          </div>
          <button onClick={onClose} className="text-white/60 hover:text-white text-2xl leading-none">×</button>
        </div>

        {fetchingPerfil ? (
          <div className="p-7 space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-12 bg-slate-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-7 space-y-4 overflow-y-auto">
            <div>
              <label className={labelCls}>Nome Completo *</label>
              <input type="text" value={form.nome_completo}
                onChange={(e) => set('nome_completo', e.target.value)}
                required className={inputCls} />
            </div>

            <div>
              <label className={labelCls}>Data de Nascimento</label>
              <input type="date" value={form.data_nascimento}
                onChange={(e) => set('data_nascimento', e.target.value)}
                className={inputCls} />
            </div>

            <div>
              <label className={labelCls}>Contato de Emergência</label>
              <input type="text" value={form.contato_emergencia}
                onChange={(e) => set('contato_emergencia', e.target.value)}
                placeholder="Ex: (85) 99999-0000"
                className={inputCls} />
            </div>

            <div>
              <label className={labelCls}>Necessidades Especiais</label>
              <textarea value={form.necessidades_especiais}
                onChange={(e) => set('necessidades_especiais', e.target.value)}
                placeholder="Descreva se houver alguma necessidade especial..."
                rows={3}
                className={inputCls + ' resize-none'} />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-100 text-red-700 text-sm rounded-xl p-3">{error}</div>
            )}

            <div className="flex gap-3 pt-1">
              <button type="button" onClick={onClose}
                className="flex-1 border border-slate-200 text-slate-600 hover:bg-slate-50 py-3 rounded-xl font-semibold text-sm transition-colors">
                Cancelar
              </button>
              <button type="submit" disabled={loading}
                className="flex-1 bg-blue-900 hover:bg-blue-800 disabled:opacity-60 text-white py-3 rounded-xl font-semibold text-sm transition-colors">
                {loading ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-slate-100 animate-pulse">
      <div className="h-32 bg-slate-200" />
      <div className="p-5 space-y-3">
        <div className="h-3 bg-slate-100 rounded w-3/4" />
        <div className="h-3 bg-slate-100 rounded w-1/2" />
        <div className="h-3 bg-slate-100 rounded w-2/3" />
        <div className="border-t border-slate-100 pt-3 grid grid-cols-2 gap-3">
          <div className="h-8 bg-slate-100 rounded" />
          <div className="h-8 bg-slate-100 rounded" />
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function DashboardPassageiro() {
  const { user } = useAuth();
  const [reservas, setReservas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showPerfil, setShowPerfil] = useState(false);

  const fetchReservas = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/passageiro/reservas/');
      setReservas(data.reservas || []);
    } catch {
      setError('Não foi possível carregar suas reservas. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReservas(); }, []);

  const ativos = reservas.filter(
    (r) => !['Concluído', 'Cancelado'].includes(r.status_voo)
  ).length;
  const totalGasto = reservas.reduce((s, r) => s + Number(r.valor_total || 0), 0);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div
        className="py-10 px-4"
        style={{
          background: 'linear-gradient(160deg, #070E1A 0%, #0F2044 55%, #1A3869 100%)',
        }}
      >
        <div className="max-w-6xl mx-auto">
          <div className="flex items-start justify-between mb-1">
            <p className="text-blue-300 text-sm">Bem-vindo de volta</p>
            <button
              onClick={() => setShowPerfil(true)}
              className="text-xs font-semibold text-white/70 hover:text-white border border-white/20 hover:border-white/50 px-3 py-1.5 rounded-lg transition-colors">
              ✏ Editar Perfil
            </button>
          </div>
          <h1 className="text-3xl font-extrabold text-white">{user?.nome}</h1>

          <div className="grid grid-cols-3 gap-4 mt-7">
            {[
              { icon: '📋', value: reservas.length, label: 'Reservas' },
              { icon: '✈', value: ativos, label: 'Voos Ativos' },
              { icon: '💳', value: fmtCurrency(totalGasto), label: 'Total Gasto' },
            ].map((s) => (
              <div
                key={s.label}
                className="bg-white/10 border border-white/10 rounded-2xl p-4"
              >
                <span className="text-2xl">{s.icon}</span>
                <p className="text-2xl font-bold text-white mt-2 leading-tight">{s.value}</p>
                <p className="text-blue-300 text-xs mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Content ─────────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-slate-800">Minhas Reservas</h2>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors"
          >
            <span className="text-base leading-none font-bold">+</span>
            Reservar Voo
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-red-700 text-sm mb-6">
            {error}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 3 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : reservas.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-6xl mb-4">🎟️</p>
            <h3 className="text-xl font-bold text-slate-700 mb-2">
              Nenhuma reserva encontrada
            </h3>
            <p className="text-slate-400 text-sm mb-6">
              Você ainda não possui reservas no seu histórico.
            </p>
            <Link
              to="/"
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl text-sm font-semibold transition-colors inline-block"
            >
              Buscar Voos
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {reservas.map((r) => (
              <ReservaCard key={`${r.codigo_localizador}-${r.id_passagem}`} r={r} />
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <ReservarModal
          onClose={() => setShowModal(false)}
          onSuccess={fetchReservas}
        />
      )}

      {showPerfil && (
        <EditarPerfilModal
          onClose={() => setShowPerfil(false)}
          onSuccess={() => {}}
        />
      )}
    </div>
  );
}
