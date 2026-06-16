import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/axios';

// ── Helpers ───────────────────────────────────────────────────────────────────
const VOO_STATUS_STYLE = {
  Programado: { cls: 'bg-blue-100 text-blue-700', dot: 'bg-blue-500' },
  'Em Voo':   { cls: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
  Concluído:  { cls: 'bg-slate-100 text-slate-500', dot: 'bg-slate-400' },
  Cancelado:  { cls: 'bg-red-100 text-red-700', dot: 'bg-red-500' },
  Atrasado:   { cls: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500' },
};
const PRESENCA_STYLE = {
  Presente:   'bg-emerald-100 text-emerald-700',
  Ausente:    'bg-red-100 text-red-700',
  'Em Espera':'bg-amber-100 text-amber-700',
};
const AUTH_STYLE = {
  Autorizado: 'bg-emerald-100 text-emerald-700',
  Negado:     'bg-red-100 text-red-700',
  Pendente:   'bg-amber-100 text-amber-700',
};
const PAG_STYLE = {
  Pago:        'bg-blue-100 text-blue-700',
  Pendente:    'bg-orange-100 text-orange-700',
  Cancelado:   'bg-red-100 text-red-700',
  Reembolsado: 'bg-slate-100 text-slate-600',
};

function fmtDate(s) {
  if (!s) return '—';
  return new Date(s + 'T00:00:00').toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}
function fmtTime(s) { return s ? s.slice(0, 5) : '—'; }
function fmtCurrency(v) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function TableSkeleton({ rows = 5, cols = 6 }) {
  return (
    <div className="p-4 space-y-2 animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4">
          {Array.from({ length: cols }).map((__, j) => (
            <div key={j} className="h-10 bg-slate-100 rounded-xl flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

// ── Aeroportos cadastrados no banco ───────────────────────────────────────────
const AEROPORTOS = [
  { iata: 'GRU', nome: 'Aeroporto Internacional de Guarulhos',          cidade: 'São Paulo',     pais: 'Brasil' },
  { iata: 'FOR', nome: 'Aeroporto Internacional Pinto Martins',          cidade: 'Fortaleza',     pais: 'Brasil' },
  { iata: 'GIG', nome: 'Aeroporto Internacional do Galeão',              cidade: 'Rio de Janeiro',pais: 'Brasil' },
  { iata: 'REC', nome: 'Aeroporto Internacional dos Guararapes',         cidade: 'Recife',        pais: 'Brasil' },
  { iata: 'MAO', nome: 'Aeroporto Internacional Eduardo Gomes',          cidade: 'Manaus',        pais: 'Brasil' },
  { iata: 'MIA', nome: 'Miami International Airport',                    cidade: 'Miami',         pais: 'EUA' },
  { iata: 'CDG', nome: 'Aéroport Paris-Charles de Gaulle',               cidade: 'Paris',         pais: 'França' },
  { iata: 'LIS', nome: 'Aeroporto Humberto Delgado',                     cidade: 'Lisboa',        pais: 'Portugal' },
  { iata: 'EZE', nome: 'Aeropuerto Internacional Ministro Pistarini',    cidade: 'Buenos Aires',  pais: 'Argentina' },
  { iata: 'BOG', nome: 'Aeropuerto Internacional El Dorado',             cidade: 'Bogotá',        pais: 'Colômbia' },
];
const IATAS_NACIONAIS = new Set(['GRU', 'FOR', 'GIG', 'REC', 'MAO']);

// ══════════════════════════════════════════════════════════════════════════════
// Modal: Criar Modelo de Aeronave
// ══════════════════════════════════════════════════════════════════════════════
function CriarModeloAeronaveModal({ onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    modelo: '', fabricante: '', capacidade: '', kms_rodados: '', preco: '',
  });

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/admin/modelos-aeronave/', {
        ...form,
        kms_rodados: form.kms_rodados || null,
        preco: form.preco || null,
      });
      onSuccess(form.modelo);
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao criar modelo.');
    } finally {
      setLoading(false);
    }
  };

  const inputCls = 'w-full border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900 bg-white';

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="px-7 py-5 text-white flex items-center justify-between"
          style={{ background: 'linear-gradient(135deg, #1A3869 0%, #0F2044 100%)' }}>
          <div>
            <h3 className="text-lg font-bold">Cadastrar Modelo de Aeronave</h3>
            <p className="text-blue-300 text-xs mt-0.5">airline.modelo_aeronave</p>
          </div>
          <button onClick={onClose} className="text-white/60 hover:text-white text-2xl leading-none">×</button>
        </div>

        <form onSubmit={handleSubmit} className="p-7 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Nome do Modelo *</label>
            <input type="text" value={form.modelo} onChange={(e) => set('modelo', e.target.value)}
              placeholder="Ex: Boeing 737-800" required className={inputCls} />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Fabricante *</label>
            <input type="text" value={form.fabricante} onChange={(e) => set('fabricante', e.target.value)}
              placeholder="Ex: Boeing, Airbus, Embraer" required className={inputCls} />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Capacidade *</label>
              <input type="number" min="1" value={form.capacidade} onChange={(e) => set('capacidade', e.target.value)}
                placeholder="189" required className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">KMs Rodados</label>
              <input type="number" min="0" value={form.kms_rodados} onChange={(e) => set('kms_rodados', e.target.value)}
                placeholder="0" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Preço (R$)</label>
              <input type="number" min="0" step="0.01" value={form.preco} onChange={(e) => set('preco', e.target.value)}
                placeholder="0.00" className={inputCls} />
            </div>
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
              {loading ? 'Cadastrando...' : 'Cadastrar Modelo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// Modal: Criar Aeronave (busca modelos internamente)
// ══════════════════════════════════════════════════════════════════════════════
function CriarAeronaveModal({ onClose, onSuccess }) {
  const [modelos, setModelos] = useState([]);
  const [showCriarModelo, setShowCriarModelo] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    cod_aeronave: '',
    modelo: '',
    data_ultima_manutencao: '',
  });

  const fetchModelos = useCallback(async () => {
    try {
      const { data } = await api.get('/admin/aeronaves/');
      setModelos(data.modelos || []);
    } catch { /* silently fail */ }
  }, []);

  useEffect(() => { fetchModelos(); }, [fetchModelos]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleModeloCriado = async (nomeModelo) => {
    setShowCriarModelo(false);
    await fetchModelos();
    set('modelo', nomeModelo);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/admin/aeronaves/', {
        ...form,
        cod_aeronave: form.cod_aeronave.toUpperCase(),
      });
      onSuccess(data.cod_aeronave);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao criar aeronave.');
    } finally {
      setLoading(false);
    }
  };

  const inputCls = 'w-full border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900 bg-white';
  const modeloSelecionado = modelos.find((m) => m.modelo === form.modelo);

  return (
    <>
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="px-7 py-5 text-white flex items-center justify-between"
          style={{ background: 'linear-gradient(135deg, #1A3869 0%, #0F2044 100%)' }}>
          <div>
            <h3 className="text-lg font-bold">Cadastrar Aeronave</h3>
            <p className="text-blue-300 text-xs mt-0.5">airline.aeronave</p>
          </div>
          <button onClick={onClose} className="text-white/60 hover:text-white text-2xl leading-none">×</button>
        </div>

        <form onSubmit={handleSubmit} className="p-7 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Código da Aeronave *</label>
            <input type="text" value={form.cod_aeronave}
              onChange={(e) => set('cod_aeronave', e.target.value.toUpperCase())}
              placeholder="Ex: PR-XYZ" required className={inputCls + ' uppercase font-mono'} />
            <p className="text-xs text-slate-400 mt-1">Padrão: prefixo do país + código (ex: PR-ABC para Brasil)</p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Modelo *</label>
              <button type="button" onClick={() => setShowCriarModelo(true)}
                className="text-xs text-blue-700 hover:text-blue-900 font-semibold flex items-center gap-1 transition-colors">
                <span className="font-bold">+</span> Novo modelo
              </button>
            </div>
            <select value={form.modelo} onChange={(e) => set('modelo', e.target.value)} required className={inputCls}>
              <option value="">Selecione o modelo...</option>
              {modelos.map((m) => (
                <option key={m.modelo} value={m.modelo}>
                  {m.modelo} — {m.fabricante} ({m.capacidade} pax)
                </option>
              ))}
            </select>
            {modelos.length === 0 && (
              <p className="text-xs text-amber-600 mt-1">Nenhum modelo cadastrado. Clique em "+ Novo modelo".</p>
            )}
            {modeloSelecionado && (
              <div className="mt-2 grid grid-cols-3 gap-2">
                {[
                  { l: 'Fabricante', v: modeloSelecionado.fabricante },
                  { l: 'Capacidade', v: `${modeloSelecionado.capacidade} pax` },
                  { l: 'KMs Rodados', v: modeloSelecionado.kms_rodados?.toLocaleString('pt-BR') || '—' },
                ].map(({ l, v }) => (
                  <div key={l} className="bg-slate-50 rounded-xl p-2 text-center">
                    <p className="text-xs text-slate-400">{l}</p>
                    <p className="text-xs font-bold text-slate-700">{v}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Última Manutenção</label>
            <input type="date" value={form.data_ultima_manutencao}
              onChange={(e) => set('data_ultima_manutencao', e.target.value)} className={inputCls} />
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
              {loading ? 'Cadastrando...' : 'Cadastrar Aeronave'}
            </button>
          </div>
        </form>
      </div>
    </div>

    {showCriarModelo && (
      <CriarModeloAeronaveModal
        onClose={() => setShowCriarModelo(false)}
        onSuccess={handleModeloCriado}
      />
    )}
    </>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// Modal: Criar Voo
// ══════════════════════════════════════════════════════════════════════════════
function CriarVooModal({ onClose, onSuccess }) {
  const [aeronaves, setAeronaves] = useState([]);
  const [modelos, setModelos] = useState([]);
  const [showCriarAeronave, setShowCriarAeronave] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    num_voo: '',
    tipo_voo: 'Nacional',
    data_partida: '',
    hora_partida: '',
    previsao_chegada: '',
    cod_aeronave: '',
    iata_origem: '',
    iata_destino: '',
  });

  const fetchAeronaves = useCallback(async () => {
    try {
      const { data } = await api.get('/admin/aeronaves/');
      setAeronaves(data.aeronaves || []);
      setModelos(data.modelos || []);
    } catch { /* silently fail */ }
  }, []);

  useEffect(() => { fetchAeronaves(); }, [fetchAeronaves]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleAeroporto = (campo, iata) => {
    setForm((f) => {
      const novoForm = { ...f, [campo]: iata };
      if (novoForm.iata_origem && novoForm.iata_destino) {
        const internacional = !IATAS_NACIONAIS.has(novoForm.iata_origem) || !IATAS_NACIONAIS.has(novoForm.iata_destino);
        novoForm.tipo_voo = internacional ? 'Internacional' : 'Nacional';
      }
      return novoForm;
    });
  };

  const handleNovaAeronave = (cod) => {
    fetchAeronaves().then(() => set('cod_aeronave', cod));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/admin/voos/', form);
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao criar voo.');
    } finally {
      setLoading(false);
    }
  };

  const inputCls = 'w-full border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900 bg-white';

  const aeroportoSelecionado = (iata) => AEROPORTOS.find((a) => a.iata === iata);
  const infoOrigem  = aeroportoSelecionado(form.iata_origem);
  const infoDestino = aeroportoSelecionado(form.iata_destino);

  return (
    <>
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[95vh] flex flex-col">
        <div className="px-8 py-6 text-white flex items-center justify-between shrink-0"
          style={{ background: 'linear-gradient(135deg, #070E1A 0%, #0F2044 100%)' }}>
          <div>
            <h3 className="text-xl font-bold">Criar Novo Voo</h3>
            <p className="text-blue-300 text-xs mt-0.5">Cadastro na tabela airline.voo + trecho</p>
          </div>
          <button onClick={onClose} className="text-white/60 hover:text-white text-2xl leading-none">×</button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-4 overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Número do Voo *</label>
                <span className={`text-xs font-mono ${form.num_voo.length > 10 ? 'text-red-500 font-bold' : 'text-slate-400'}`}>
                  {form.num_voo.length}/10
                </span>
              </div>
              <input type="text" value={form.num_voo}
                onChange={(e) => set('num_voo', e.target.value.toUpperCase().slice(0, 10))}
                placeholder="Ex: LA9999" required maxLength={10}
                className={inputCls + ' font-mono'} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Tipo</label>
              <div className={`${inputCls} flex items-center gap-2 cursor-default select-none`}>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  form.tipo_voo === 'Internacional' ? 'bg-purple-100 text-purple-700' : 'bg-sky-100 text-sky-700'
                }`}>{form.tipo_voo}</span>
                <span className="text-slate-400 text-xs">auto-detectado</span>
              </div>
            </div>
          </div>

          {/* Aeronave + botão nova aeronave */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Aeronave *</label>
              <button type="button" onClick={() => setShowCriarAeronave(true)}
                className="text-xs text-blue-700 hover:text-blue-900 font-semibold flex items-center gap-1 transition-colors">
                <span className="font-bold">+</span> Nova aeronave
              </button>
            </div>
            <select value={form.cod_aeronave} onChange={(e) => set('cod_aeronave', e.target.value)} required className={inputCls}>
              <option value="">Selecione a aeronave...</option>
              {aeronaves.map((a) => (
                <option key={a.cod_aeronave} value={a.cod_aeronave} disabled={a.aviso_manutencao}>
                  {a.cod_aeronave} — {a.modelo} ({a.capacidade} pax){a.aviso_manutencao ? ' ⚠️ Em manutenção' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Rota: dropdowns de aeroporto */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Aeroporto de Origem *</label>
              <select value={form.iata_origem} onChange={(e) => handleAeroporto('iata_origem', e.target.value)} required className={inputCls}>
                <option value="">Selecione...</option>
                {AEROPORTOS.map((a) => (
                  <option key={a.iata} value={a.iata} disabled={a.iata === form.iata_destino}>
                    {a.iata} — {a.cidade} ({a.pais})
                  </option>
                ))}
              </select>
              {infoOrigem && (
                <p className="text-xs text-slate-400 mt-1 truncate" title={infoOrigem.nome}>{infoOrigem.nome}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Aeroporto de Destino *</label>
              <select value={form.iata_destino} onChange={(e) => handleAeroporto('iata_destino', e.target.value)} required className={inputCls}>
                <option value="">Selecione...</option>
                {AEROPORTOS.map((a) => (
                  <option key={a.iata} value={a.iata} disabled={a.iata === form.iata_origem}>
                    {a.iata} — {a.cidade} ({a.pais})
                  </option>
                ))}
              </select>
              {infoDestino && (
                <p className="text-xs text-slate-400 mt-1 truncate" title={infoDestino.nome}>{infoDestino.nome}</p>
              )}
            </div>
          </div>

          {/* Prévia da rota */}
          {infoOrigem && infoDestino && (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 flex items-center gap-3">
              <div className="text-center">
                <p className="font-mono font-bold text-slate-800">{infoOrigem.iata}</p>
                <p className="text-xs text-slate-400">{infoOrigem.cidade}</p>
              </div>
              <div className="flex-1 border-t-2 border-dashed border-slate-300 relative">
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-slate-400 text-base">✈</span>
              </div>
              <div className="text-center">
                <p className="font-mono font-bold text-slate-800">{infoDestino.iata}</p>
                <p className="text-xs text-slate-400">{infoDestino.cidade}</p>
              </div>
              <span className={`ml-2 text-xs font-bold px-2.5 py-1 rounded-full ${
                form.tipo_voo === 'Internacional' ? 'bg-purple-100 text-purple-700' : 'bg-sky-100 text-sky-700'
              }`}>{form.tipo_voo}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Data de Partida *</label>
              <input type="date" value={form.data_partida} onChange={(e) => set('data_partida', e.target.value)} required className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Hora de Partida *</label>
              <input type="time" value={form.hora_partida} onChange={(e) => set('hora_partida', e.target.value)} required className={inputCls} />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Previsão de Chegada *</label>
            <input type="datetime-local" value={form.previsao_chegada}
              onChange={(e) => set('previsao_chegada', e.target.value)} required className={inputCls} />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100 text-red-700 text-sm rounded-xl p-3">{error}</div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 border border-slate-200 text-slate-600 hover:bg-slate-50 py-3 rounded-xl font-semibold text-sm transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white py-3 rounded-xl font-semibold text-sm transition-colors">
              {loading ? 'Criando...' : 'Criar Voo'}
            </button>
          </div>
        </form>
      </div>
    </div>

    {showCriarAeronave && (
      <CriarAeronaveModal
        onClose={() => setShowCriarAeronave(false)}
        onSuccess={(cod) => { setShowCriarAeronave(false); handleNovaAeronave(cod); }}
      />
    )}
    </>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// Modal: Detalhes do Voo (Passageiros + Tripulação)
// ══════════════════════════════════════════════════════════════════════════════
function FlightDetailModal({ numVoo, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [innerTab, setInnerTab] = useState('passageiros');
  const [actionLoading, setActionLoading] = useState(null);
  const [feedback, setFeedback] = useState('');

  const fetchDetail = useCallback(async () => {
    setLoading(true);
    try {
      const { data: res } = await api.get(`/admin/voos/${numVoo}/detalhes/`);
      setData(res);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [numVoo]);

  useEffect(() => { fetchDetail(); }, [fetchDetail]);

  const handleEscalar = async (id_funcionario) => {
    setActionLoading(id_funcionario);
    try {
      await api.post(`/admin/voos/${numVoo}/escala/`, { id_funcionario });
      setFeedback('Funcionário escalado.');
      await fetchDetail();
    } catch (err) {
      setFeedback(err.response?.data?.error || 'Erro ao escalar.');
    } finally {
      setActionLoading(null);
      setTimeout(() => setFeedback(''), 3000);
    }
  };

  const handleDesescalar = async (id_funcionario) => {
    setActionLoading(id_funcionario);
    try {
      await api.delete(`/admin/voos/${numVoo}/escala/${id_funcionario}/`);
      setFeedback('Funcionário removido da escala.');
      await fetchDetail();
    } catch (err) {
      setFeedback(err.response?.data?.error || 'Erro ao remover.');
    } finally {
      setActionLoading(null);
      setTimeout(() => setFeedback(''), 3000);
    }
  };

  const voo = data?.voo;
  const passageiros = data?.passageiros || [];
  const emVooOuConcluido = ['Em Voo', 'Concluído'].includes(voo?.status_voo);
  const passageirosVisiveis = emVooOuConcluido
    ? passageiros.filter((p) => p.status_autorizacao !== 'Negado')
    : passageiros;
  const comissao = data?.comissao || [];
  const escalados = comissao.filter((f) => f.escalado_neste_voo);
  const disponiveis = comissao.filter((f) => !f.escalado_neste_voo);
  const escalaEditavel = ['Programado', 'Atrasado'].includes(voo?.status_voo);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-8 py-5 rounded-t-3xl text-white flex items-center justify-between shrink-0"
          style={{ background: 'linear-gradient(135deg, #070E1A 0%, #0F2044 100%)' }}>
          <div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-sm bg-white/15 px-3 py-1 rounded-lg font-bold">
                {numVoo}
              </span>
              {voo && (
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                  VOO_STATUS_STYLE[voo.status_voo]?.cls || 'bg-white/20 text-white'
                }`}>
                  {voo.status_voo}
                </span>
              )}
            </div>
            {voo && (
              <p className="text-blue-300 text-xs mt-1">
                {voo.trechos?.[0]?.cidade_origem} → {voo.trechos?.[0]?.cidade_destino} ·{' '}
                {fmtDate(voo.data_partida)} às {fmtTime(voo.hora_partida)}
              </p>
            )}
            {voo?.status_voo === 'Cancelado' && voo?.data_hora_cancelamento && (
              <p className="text-red-300 text-xs mt-0.5">
                ⚠ Cancelado em: {new Date(voo.data_hora_cancelamento).toLocaleString('pt-BR')}
              </p>
            )}
          </div>
          <button onClick={onClose} className="text-white/60 hover:text-white text-2xl leading-none">×</button>
        </div>

        {/* Inner tabs */}
        <div className="flex gap-1 border-b border-slate-200 px-6 shrink-0">
          {[
            { key: 'passageiros', label: `🧳 Passageiros (${passageirosVisiveis.length})` },
            { key: 'tripulacao',  label: `✈ Tripulação (${escalados.length} escalados)` },
          ].map((t) => (
            <button key={t.key} onClick={() => setInnerTab(t.key)}
              className={`px-5 py-3 text-sm font-semibold border-b-2 transition-all ${
                innerTab === t.key
                  ? 'border-blue-900 text-blue-900'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-6">
          {feedback && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-2xl px-5 py-3 mb-4 font-medium">
              {feedback}
            </div>
          )}

          {loading ? (
            <TableSkeleton rows={5} cols={4} />
          ) : !data ? (
            <p className="text-center text-slate-400 py-12">Erro ao carregar detalhes do voo.</p>
          ) : (

            /* ── Tab: Passageiros ── */
            innerTab === 'passageiros' ? (
              passageirosVisiveis.length === 0 ? (
                <div className="text-center py-16 text-slate-400">
                  <p className="text-4xl mb-3">🧳</p>
                  <p>Nenhum passageiro confirmado neste voo.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100" style={{ backgroundColor: '#F8FAFC' }}>
                        {['Passageiro', 'Documento', 'Assento', 'Classe', 'Localizador', 'Pagamento', 'Embarque'].map((h) => (
                          <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {passageirosVisiveis.map((p) => (
                        <tr key={p.id_passagem} className="hover:bg-slate-50/70">
                          <td className="px-4 py-3 font-semibold text-slate-800 whitespace-nowrap">{p.nome_completo}</td>
                          <td className="px-4 py-3">
                            <span className="font-mono text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-lg">{p.documento_identidade}</span>
                          </td>
                          <td className="px-4 py-3 font-bold text-slate-700">{p.assento_passageiro}</td>
                          <td className="px-4 py-3 text-xs text-slate-600">{p.classe_cabine}</td>
                          <td className="px-4 py-3 font-mono text-xs text-slate-500">{p.codigo_localizador}</td>
                          <td className="px-4 py-3">
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                              p.status_pagamento === 'Pago' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                            }`}>{p.status_pagamento}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                              AUTH_STYLE[p.status_autorizacao] || 'bg-slate-100 text-slate-600'
                            }`}>{p.status_autorizacao || '—'}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            ) : (

            /* ── Tab: Tripulação ── */
            <div className="space-y-6">
              {/* Aviso de bloqueio quando voo não é editável */}
              {!escalaEditavel && (
                <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-3">
                  <span className="text-amber-500 text-lg">🔒</span>
                  <p className="text-sm text-amber-700 font-medium">
                    A escala não pode ser alterada — o voo está <strong>{voo?.status_voo}</strong>.
                    Alterações só são permitidas antes de iniciar o voo.
                  </p>
                </div>
              )}

              {/* Escalados */}
              <div>
                <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                  Tripulação Escalada ({escalados.length})
                </h4>
                {escalados.length === 0 ? (
                  <p className="text-slate-400 text-sm bg-slate-50 rounded-2xl p-4 text-center">
                    Nenhum funcionário escalado.{escalaEditavel ? ' Adicione abaixo.' : ''}
                  </p>
                ) : (
                  <div className="space-y-2">
                    {escalados.map((f) => (
                      <div key={f.id_funcionario}
                        className="flex items-center justify-between bg-emerald-50 border border-emerald-100 rounded-2xl px-5 py-3">
                        <div className="flex items-center gap-3">
                          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                            f.cargo === 'Piloto' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                          }`}>{f.cargo}</span>
                          <div>
                            <p className="font-semibold text-slate-800 text-sm">{f.nome_completo}</p>
                            {f.licenca_piloto && (
                              <p className="text-xs text-slate-400 font-mono">{f.licenca_piloto}</p>
                            )}
                          </div>
                        </div>
                        {escalaEditavel && (
                          <button
                            onClick={() => handleDesescalar(f.id_funcionario)}
                            disabled={actionLoading === f.id_funcionario}
                            className="text-xs font-semibold bg-red-100 hover:bg-red-200 text-red-700 disabled:opacity-50 px-3 py-1.5 rounded-lg transition-colors">
                            {actionLoading === f.id_funcionario ? '...' : '✗ Remover'}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Disponíveis para escalar — só aparece se editável */}
              {escalaEditavel && disponiveis.length > 0 && (
                <div>
                  <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-slate-300 inline-block" />
                    Disponíveis para Escalar ({disponiveis.length})
                  </h4>
                  <div className="space-y-2">
                    {disponiveis.map((f) => (
                      <div key={f.id_funcionario}
                        className="flex items-center justify-between bg-white border border-slate-200 rounded-2xl px-5 py-3 hover:border-blue-200 transition-colors">
                        <div className="flex items-center gap-3">
                          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                            f.cargo === 'Piloto' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                          }`}>{f.cargo}</span>
                          <div>
                            <p className="font-semibold text-slate-800 text-sm">{f.nome_completo}</p>
                            {f.licenca_piloto && (
                              <p className="text-xs text-slate-400 font-mono">{f.licenca_piloto}</p>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => handleEscalar(f.id_funcionario)}
                          disabled={actionLoading === f.id_funcionario}
                          className="text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 px-3 py-1.5 rounded-lg transition-colors">
                          {actionLoading === f.id_funcionario ? '...' : '+ Escalar'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Transições de status permitidas por status atual
const STATUS_ACOES = {
  Programado: [
    { label: '▶ Iniciar',  status: 'Em Voo',    cls: 'bg-emerald-600 hover:bg-emerald-700 text-white' },
    { label: '✕ Cancelar', status: 'Cancelado',  cls: 'bg-red-100 hover:bg-red-200 text-red-700' },
  ],
  Atrasado: [
    { label: '▶ Iniciar',  status: 'Em Voo',    cls: 'bg-emerald-600 hover:bg-emerald-700 text-white' },
    { label: '✕ Cancelar', status: 'Cancelado',  cls: 'bg-red-100 hover:bg-red-200 text-red-700' },
  ],
  'Em Voo': [
    { label: '✓ Concluir', status: 'Concluído',  cls: 'bg-blue-900 hover:bg-blue-800 text-white' },
  ],
};

// ══════════════════════════════════════════════════════════════════════════════
// Tab: Voos (com Criar Voo + Detalhes + Gerenciar Status)
// ══════════════════════════════════════════════════════════════════════════════
function VoosTab({ voos, loading, onVooCreated, onSearch }) {
  const [showCriar, setShowCriar] = useState(false);
  const [detailVoo, setDetailVoo] = useState(null);
  const [statusLoading, setStatusLoading] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [search, setSearch] = useState('');
  const mountedRef = useRef(false);

  useEffect(() => {
    if (!mountedRef.current) { mountedRef.current = true; return; }
    const t = setTimeout(() => onSearch(search), search ? 400 : 0);
    return () => clearTimeout(t);
  }, [search, onSearch]);

  const handleStatus = async (num_voo, novoStatus) => {
    setStatusLoading(num_voo + novoStatus);
    try {
      await api.patch(`/admin/voos/${num_voo}/status/`, { status: novoStatus });
      setFeedback(`Voo ${num_voo} → ${novoStatus}.`);
      onVooCreated();
    } catch (err) {
      setFeedback(err.response?.data?.error || 'Erro ao atualizar status.');
    } finally {
      setStatusLoading(null);
      setTimeout(() => setFeedback(''), 4000);
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between mb-4">
        <div className="relative flex-1 max-w-sm">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por número do voo..."
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400 transition-colors"
          />
        </div>
        <div className="flex items-center gap-3">
          <p className="text-sm text-slate-500 whitespace-nowrap">
            {voos.length} voo(s)
          </p>
          <button
            onClick={() => setShowCriar(true)}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors whitespace-nowrap">
            <span className="font-bold text-base leading-none">+</span> Criar Voo
          </button>
        </div>
      </div>

      {feedback && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-2xl px-5 py-3 mb-4 font-medium">
          {feedback}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <TableSkeleton rows={6} cols={9} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100" style={{ backgroundColor: '#F8FAFC' }}>
                  {['Número', 'Rota', 'Data', 'Horários', 'Capacidade', 'Tipo', 'Status', 'Aeronave', 'Ações'].map((h) => (
                    <th key={h} className="text-left px-4 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {voos.map((voo) => {
                  const st = VOO_STATUS_STYLE[voo.status_voo] || VOO_STATUS_STYLE.Programado;
                  const chegada = voo.previsao_chegada
                    ? new Date(voo.previsao_chegada).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                    : '—';
                  const ativo = ['Em Voo', 'Concluído'].includes(voo.status_voo);
                  const contPassageiros = ativo
                    ? (voo.passagens_embarcadas ?? voo.passagens_emitidas)
                    : voo.passagens_emitidas;
                  const lotado = (voo.assentos_restantes ?? 99) <= 0;
                  const acoes = STATUS_ACOES[voo.status_voo] || [];
                  return (
                    <tr key={voo.num_voo} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-4">
                        <span className="font-mono text-xs font-bold border border-slate-200 text-slate-600 px-2 py-1 rounded-lg">
                          {voo.num_voo}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2 whitespace-nowrap">
                          <div>
                            <p className="font-semibold text-slate-800 text-xs">{voo.cidade_origem}</p>
                            <p className="text-slate-400 font-mono text-xs">{voo.iata_origem}</p>
                          </div>
                          <span className="text-slate-300 text-xs">→</span>
                          <div>
                            <p className="font-semibold text-slate-800 text-xs">{voo.cidade_destino}</p>
                            <p className="text-slate-400 font-mono text-xs">{voo.iata_destino}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-slate-600 text-xs whitespace-nowrap">{fmtDate(voo.data_partida)}</td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <p className="font-semibold text-slate-800 text-xs">{fmtTime(voo.hora_partida)}</p>
                        <p className="text-slate-400 text-xs">{chegada}</p>
                      </td>
                      <td className="px-4 py-4">
                        {voo.capacidade_total != null ? (
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                            lotado ? 'bg-red-100 text-red-700' : 'bg-emerald-50 text-emerald-700'
                          }`}>
                            {lotado ? 'LOTADO' : `${contPassageiros}/${voo.capacidade_total}`}
                          </span>
                        ) : <span className="text-slate-300 text-xs">—</span>}
                      </td>
                      <td className="px-4 py-4">
                        <span className={`text-xs px-2 py-0.5 rounded-lg font-medium ${
                          voo.tipo_voo === 'Internacional' ? 'bg-purple-100 text-purple-700' : 'bg-sky-100 text-sky-700'
                        }`}>{voo.tipo_voo}</span>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${st.cls}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                          {voo.status_voo}
                        </span>
                        {voo.status_voo === 'Cancelado' && voo.data_hora_cancelamento && (
                          <p className="text-xs text-red-500 mt-0.5 whitespace-nowrap">
                            {new Date(voo.data_hora_cancelamento).toLocaleString('pt-BR', {
                              day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
                            })}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-4 font-mono text-xs text-slate-500">{voo.cod_aeronave}</td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2 whitespace-nowrap">
                          {acoes.map((acao) => (
                            <button key={acao.status}
                              onClick={() => handleStatus(voo.num_voo, acao.status)}
                              disabled={statusLoading === voo.num_voo + acao.status}
                              className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 ${acao.cls}`}>
                              {statusLoading === voo.num_voo + acao.status ? '...' : acao.label}
                            </button>
                          ))}
                          <button
                            onClick={() => setDetailVoo(voo.num_voo)}
                            className="text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors">
                            Detalhes ›
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {voos.length === 0 && !loading && (
                  <tr><td colSpan={9} className="px-5 py-16 text-center text-slate-400">
                    {search.trim() ? `Nenhum voo encontrado para "${search.trim().toUpperCase()}".` : 'Nenhum voo cadastrado.'}
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showCriar && (
        <CriarVooModal
          onClose={() => setShowCriar(false)}
          onSuccess={() => { onVooCreated(); setShowCriar(false); }}
        />
      )}
      {detailVoo && (
        <FlightDetailModal numVoo={detailVoo} onClose={() => setDetailVoo(null)} />
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// Tab: Passageiros
// ══════════════════════════════════════════════════════════════════════════════
function PassageirosTab({ passageiros, loading, search, onSearch }) {
  return (
    <div className="space-y-4">
      <input type="text" value={search} onChange={(e) => onSearch(e.target.value)}
        placeholder="🔍 Buscar por nome ou documento..."
        className="w-full max-w-sm border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-900 placeholder:text-slate-400" />

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? <TableSkeleton rows={6} cols={5} /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100" style={{ backgroundColor: '#F8FAFC' }}>
                  {['Nome Completo', 'Documento', 'Nascimento', 'Passagens', 'Nec. Especiais', 'Contato Emergência'].map((h) => (
                    <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {passageiros.map((p) => (
                  <tr key={p.id_passageiro} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-4 font-semibold text-slate-800">{p.nome_completo}</td>
                    <td className="px-5 py-4">
                      <span className="font-mono text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-lg">{p.documento_identidade}</span>
                    </td>
                    <td className="px-5 py-4 text-slate-600 text-xs whitespace-nowrap">{fmtDate(p.data_nascimento)}</td>
                    <td className="px-5 py-4">
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full text-white" style={{ backgroundColor: '#0F2044' }}>
                        {p.total_passagens}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      {p.necessidades_especiais
                        ? <span className="text-xs font-semibold bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full">♿ Sim</span>
                        : <span className="text-slate-300 text-xs">—</span>}
                    </td>
                    <td className="px-5 py-4 text-slate-500 text-xs">{p.contato_emergencia || '—'}</td>
                  </tr>
                ))}
                {passageiros.length === 0 && (
                  <tr><td colSpan={6} className="px-5 py-16 text-center text-slate-400">
                    {search ? `Nenhum resultado para "${search}".` : 'Nenhum passageiro cadastrado.'}
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// Modal: Criar Funcionário (Piloto ou Comissário)
// ══════════════════════════════════════════════════════════════════════════════
const NIVEIS_FLUENCIA = ['Nativo', 'Avançado', 'Intermediário', 'Básico'];

function SeletorIdiomas({ idiomasDisponiveis, selecionados, onChange }) {
  const toggle = (cod_idioma) => {
    const existe = selecionados.find((i) => i.cod_idioma === cod_idioma);
    if (existe) {
      onChange(selecionados.filter((i) => i.cod_idioma !== cod_idioma));
    } else {
      onChange([...selecionados, { cod_idioma, nivel_fluencia: 'Nativo' }]);
    }
  };
  const setNivel = (cod_idioma, nivel_fluencia) => {
    onChange(selecionados.map((i) => i.cod_idioma === cod_idioma ? { ...i, nivel_fluencia } : i));
  };
  return (
    <div className="space-y-2">
      {idiomasDisponiveis.map((idioma) => {
        const sel = selecionados.find((i) => i.cod_idioma === idioma.cod_idioma);
        return (
          <div key={idioma.cod_idioma} className="flex items-center gap-2">
            <button type="button" onClick={() => toggle(idioma.cod_idioma)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all min-w-[90px] text-left ${
                sel ? 'bg-purple-600 text-white border-purple-600' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
              }`}>
              {sel ? '✓ ' : ''}{idioma.nome}
            </button>
            {sel && (
              <select value={sel.nivel_fluencia} onChange={(e) => setNivel(idioma.cod_idioma, e.target.value)}
                className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-purple-400">
                {NIVEIS_FLUENCIA.map((n) => <option key={n}>{n}</option>)}
              </select>
            )}
          </div>
        );
      })}
    </div>
  );
}

function CriarFuncionarioModal({ onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [idiomasDisponiveis, setIdiomasDisponiveis] = useState([]);
  const [idiomasSelecionados, setIdiomasSelecionados] = useState([]);
  const [form, setForm] = useState({
    cargo: 'Piloto',
    nome_completo: '',
    cpf: '',
    data_admissao: '',
    salario_base: '',
    licenca_piloto: '',
    validade_habilitacao: '',
    validade_certificado: '',
  });

  useEffect(() => {
    api.get('/admin/idiomas/').then(({ data }) => setIdiomasDisponiveis(data.idiomas || []));
  }, []);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload = { ...form, ...(form.cargo === 'Comissário' ? { idiomas: idiomasSelecionados } : {}) };
      await api.post('/admin/funcionarios/', payload);
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao cadastrar funcionário.');
    } finally {
      setLoading(false);
    }
  };

  const inputCls = 'w-full border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900 bg-white';
  const labelCls = 'block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5';

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[95vh] flex flex-col">
        <div className="px-7 py-5 text-white flex items-center justify-between shrink-0"
          style={{ background: 'linear-gradient(135deg, #070E1A 0%, #0F2044 100%)' }}>
          <div>
            <h3 className="text-lg font-bold">Cadastrar Funcionário</h3>
            <p className="text-blue-300 text-xs mt-0.5">airline.comissao_de_bordo + subclasse</p>
          </div>
          <button onClick={onClose} className="text-white/60 hover:text-white text-2xl leading-none">×</button>
        </div>

        <form onSubmit={handleSubmit} className="p-7 space-y-4 overflow-y-auto">
          {/* Cargo */}
          <div>
            <label className={labelCls}>Cargo *</label>
            <div className="flex gap-3">
              {['Piloto', 'Comissário'].map((c) => (
                <button key={c} type="button" onClick={() => set('cargo', c)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                    form.cargo === c
                      ? c === 'Piloto'
                        ? 'bg-blue-900 text-white border-blue-900'
                        : 'bg-purple-700 text-white border-purple-700'
                      : 'border-slate-200 text-slate-500 hover:border-slate-300'
                  }`}>
                  {c === 'Piloto' ? '✈ Piloto' : '🛎 Comissário'}
                </button>
              ))}
            </div>
          </div>

          {/* Dados comuns */}
          <div>
            <label className={labelCls}>Nome Completo *</label>
            <input type="text" value={form.nome_completo} onChange={(e) => set('nome_completo', e.target.value)}
              placeholder="Ex: Maria Silva" required className={inputCls} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>CPF *</label>
              <input type="text" value={form.cpf}
                onChange={(e) => set('cpf', e.target.value.replace(/\D/g, '').slice(0, 11))}
                placeholder="11 dígitos" required maxLength={11}
                className={inputCls + ' font-mono'} />
            </div>
            <div>
              <label className={labelCls}>Data de Admissão *</label>
              <input type="date" value={form.data_admissao} onChange={(e) => set('data_admissao', e.target.value)}
                required className={inputCls} />
            </div>
          </div>

          <div>
            <label className={labelCls}>Salário Base (R$) *</label>
            <input type="number" min="0.01" step="0.01" value={form.salario_base}
              onChange={(e) => set('salario_base', e.target.value)}
              placeholder="Ex: 8500.00" required className={inputCls} />
          </div>

          {/* Campos específicos do cargo */}
          {form.cargo === 'Piloto' ? (
            <div className="border border-blue-100 bg-blue-50/40 rounded-2xl p-4 space-y-3">
              <p className="text-xs font-bold text-blue-700 uppercase tracking-wide">Dados do Piloto</p>
              <div>
                <label className={labelCls}>Licença de Piloto *</label>
                <input type="text" value={form.licenca_piloto} onChange={(e) => set('licenca_piloto', e.target.value)}
                  placeholder="Ex: ANAC-12345" required className={inputCls + ' font-mono'} />
              </div>
              <div>
                <label className={labelCls}>Validade da Habilitação *</label>
                <input type="date" value={form.validade_habilitacao} onChange={(e) => set('validade_habilitacao', e.target.value)}
                  required className={inputCls} />
              </div>
            </div>
          ) : (
            <div className="border border-purple-100 bg-purple-50/40 rounded-2xl p-4 space-y-3">
              <p className="text-xs font-bold text-purple-700 uppercase tracking-wide">Dados do Comissário</p>
              <div>
                <label className={labelCls}>Validade do Certificado *</label>
                <input type="date" value={form.validade_certificado} onChange={(e) => set('validade_certificado', e.target.value)}
                  required className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Idiomas</label>
                <SeletorIdiomas
                  idiomasDisponiveis={idiomasDisponiveis}
                  selecionados={idiomasSelecionados}
                  onChange={setIdiomasSelecionados}
                />
              </div>
            </div>
          )}

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
              {loading ? 'Cadastrando...' : 'Cadastrar Funcionário'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// Modal: Editar Funcionário
// ══════════════════════════════════════════════════════════════════════════════
function EditarFuncionarioModal({ funcionario, onClose, onSuccess }) {
  const isPiloto = funcionario.cargo === 'Piloto';
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [idiomasDisponiveis, setIdiomasDisponiveis] = useState([]);
  const [idiomasSelecionados, setIdiomasSelecionados] = useState(
    (funcionario.idiomas || []).map((i) => ({ cod_idioma: i.cod_idioma, nivel_fluencia: i.nivel_fluencia }))
  );
  const [form, setForm] = useState({
    nome_completo: funcionario.nome_completo || '',
    salario_base: funcionario.salario_base || '',
    licenca_piloto: funcionario.licenca_piloto || '',
    validade_habilitacao: funcionario.validade_certificado && isPiloto ? funcionario.validade_certificado : '',
    validade_certificado: !isPiloto ? (funcionario.validade_certificado || '') : '',
  });

  useEffect(() => {
    if (!isPiloto) {
      api.get('/admin/idiomas/').then(({ data }) => setIdiomasDisponiveis(data.idiomas || []));
    }
  }, [isPiloto]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const payload = {
      nome_completo: form.nome_completo,
      salario_base: form.salario_base,
      ...(isPiloto
        ? { licenca_piloto: form.licenca_piloto, validade_habilitacao: form.validade_habilitacao }
        : { validade_certificado: form.validade_certificado, idiomas: idiomasSelecionados }),
    };
    try {
      await api.patch(`/admin/funcionarios/${funcionario.id_funcionario}/`, payload);
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao atualizar funcionário.');
    } finally {
      setLoading(false);
    }
  };

  const inputCls = 'w-full border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900 bg-white';
  const labelCls = 'block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5';
  const accentColor = isPiloto ? 'blue' : 'purple';

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[95vh] flex flex-col">
        <div className="px-7 py-5 text-white flex items-center justify-between shrink-0"
          style={{ background: 'linear-gradient(135deg, #070E1A 0%, #0F2044 100%)' }}>
          <div>
            <h3 className="text-lg font-bold">Editar Funcionário</h3>
            <p className="text-blue-300 text-xs mt-0.5">
              {isPiloto ? '✈ Piloto' : '🛎 Comissário'} · CPF {funcionario.cpf}
            </p>
          </div>
          <button onClick={onClose} className="text-white/60 hover:text-white text-2xl leading-none">×</button>
        </div>

        <form onSubmit={handleSubmit} className="p-7 space-y-4 overflow-y-auto">
          <div>
            <label className={labelCls}>Nome Completo *</label>
            <input type="text" value={form.nome_completo}
              onChange={(e) => set('nome_completo', e.target.value)}
              required className={inputCls} />
          </div>

          <div>
            <label className={labelCls}>Salário Base (R$) *</label>
            <input type="number" min="0.01" step="0.01" value={form.salario_base}
              onChange={(e) => set('salario_base', e.target.value)}
              required className={inputCls} />
          </div>

          {isPiloto ? (
            <div className={`border border-${accentColor}-100 bg-${accentColor}-50/40 rounded-2xl p-4 space-y-3`}>
              <p className={`text-xs font-bold text-${accentColor}-700 uppercase tracking-wide`}>Dados do Piloto</p>
              <div>
                <label className={labelCls}>Licença de Piloto</label>
                <input type="text" value={form.licenca_piloto}
                  onChange={(e) => set('licenca_piloto', e.target.value)}
                  className={inputCls + ' font-mono'} />
              </div>
              <div>
                <label className={labelCls}>Validade da Habilitação</label>
                <input type="date" value={form.validade_habilitacao}
                  onChange={(e) => set('validade_habilitacao', e.target.value)}
                  className={inputCls} />
              </div>
            </div>
          ) : (
            <div className="border border-purple-100 bg-purple-50/40 rounded-2xl p-4 space-y-3">
              <p className="text-xs font-bold text-purple-700 uppercase tracking-wide">Dados do Comissário</p>
              <div>
                <label className={labelCls}>Validade do Certificado</label>
                <input type="date" value={form.validade_certificado}
                  onChange={(e) => set('validade_certificado', e.target.value)}
                  className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Idiomas</label>
                <SeletorIdiomas
                  idiomasDisponiveis={idiomasDisponiveis}
                  selecionados={idiomasSelecionados}
                  onChange={setIdiomasSelecionados}
                />
              </div>
            </div>
          )}

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
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// Tab: Tripulação (visão geral de todos os funcionários)
// ══════════════════════════════════════════════════════════════════════════════
function TripulacaoTab() {
  const [funcionarios, setFuncionarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCriar, setShowCriar] = useState(false);
  const [editando, setEditando] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteFeedback, setDeleteFeedback] = useState('');
  const [search, setSearch] = useState('');

  const fetchFuncionarios = useCallback((busca = '') => {
    setLoading(true);
    api.get('/admin/comissao/', { params: busca ? { busca } : {} })
      .then(({ data }) => { setFuncionarios(data.funcionarios || []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchFuncionarios(); }, [fetchFuncionarios]);

  useEffect(() => {
    const t = setTimeout(() => fetchFuncionarios(search), search ? 400 : 0);
    return () => clearTimeout(t);
  }, [search, fetchFuncionarios]);

  const handleDeletar = async (id_funcionario) => {
    setDeleteLoading(true);
    try {
      await api.delete(`/admin/funcionarios/${id_funcionario}/`);
      setConfirmDelete(null);
      setDeleteFeedback('Funcionário excluído com sucesso.');
      fetchFuncionarios(search);
      setTimeout(() => setDeleteFeedback(''), 4000);
    } catch (err) {
      setDeleteFeedback(err.response?.data?.error || 'Erro ao excluir funcionário.');
      setConfirmDelete(null);
      setTimeout(() => setDeleteFeedback(''), 5000);
    } finally {
      setDeleteLoading(false);
    }
  };

  const pilotos = funcionarios.filter((f) => f.cargo === 'Piloto');
  const comissarios = funcionarios.filter((f) => f.cargo === 'Comissário');

  return (
    <div className="space-y-6">
      {deleteFeedback && (
        <div className={`text-sm rounded-2xl px-5 py-3 mb-2 font-medium border ${
          deleteFeedback.includes('sucesso')
            ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
            : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          {deleteFeedback}
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div className="relative flex-1 max-w-sm">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome ou CPF..."
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-colors"
          />
        </div>
        <div className="flex items-center gap-3">
          <p className="text-sm text-slate-500 whitespace-nowrap">
            {pilotos.length} piloto(s) · {comissarios.length} comissário(s)
          </p>
          <button
            onClick={() => setShowCriar(true)}
            className="flex items-center gap-2 bg-blue-900 hover:bg-blue-800 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors whitespace-nowrap">
            <span className="font-bold text-base leading-none">+</span> Adicionar Funcionário
          </button>
        </div>
      </div>

      {[
        { titulo: '✈ Pilotos', lista: pilotos, cor: 'blue' },
        { titulo: '🛎 Comissários de Bordo', lista: comissarios, cor: 'purple' },
      ].map(({ titulo, lista, cor }) => (
        <div key={titulo}>
          <h3 className="text-sm font-bold text-slate-700 mb-3">{titulo} ({lista.length})</h3>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            {loading ? <TableSkeleton rows={4} cols={5} /> : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100" style={{ backgroundColor: '#F8FAFC' }}>
                      {['Nome', 'CPF', cor === 'blue' ? 'Licença' : 'Idiomas', 'Validade', 'Salário', 'Voos Escalados', ''].map((h) => (
                        <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {lista.map((f) => (
                      <tr key={f.id_funcionario} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-5 py-4 font-semibold text-slate-800">{f.nome_completo}</td>
                        <td className="px-5 py-4 font-mono text-xs text-slate-500">{f.cpf}</td>
                        <td className="px-5 py-4">
                          {cor === 'blue' ? (
                            f.licenca_piloto
                              ? <span className="font-mono text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-lg">{f.licenca_piloto}</span>
                              : <span className="text-slate-400 text-xs">—</span>
                          ) : (
                            f.idiomas?.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {f.idiomas.slice(0, 2).map((id) => (
                                  <span key={id.cod_idioma}
                                    className="relative group text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded-lg cursor-default select-none">
                                    {id.nome}
                                    <span className="absolute bottom-full left-0 mb-1 px-2 py-1 bg-slate-800 text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                      {id.nivel_fluencia}
                                    </span>
                                  </span>
                                ))}
                                {f.idiomas.length > 2 && (
                                  <span className="text-xs font-semibold text-slate-400 self-center">+{f.idiomas.length - 2}</span>
                                )}
                              </div>
                            ) : <span className="text-slate-400 text-xs">—</span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-slate-600 text-xs">{fmtDate(f.validade_certificado)}</td>
                        <td className="px-5 py-4 text-slate-700 text-xs font-semibold">{fmtCurrency(f.salario_base)}</td>
                        <td className="px-5 py-4">
                          <span className={`text-xs font-bold px-2.5 py-1 rounded-full text-white ${
                            Number(f.total_voos) > 0 ? 'bg-emerald-600' : 'bg-slate-300'
                          }`}>{f.total_voos}</span>
                        </td>
                        <td className="px-5 py-4">
                          {confirmDelete === f.id_funcionario ? (
                            <div className="flex items-center gap-1.5 whitespace-nowrap">
                              <span className="text-xs text-red-700 font-semibold">Excluir?</span>
                              <button
                                onClick={() => handleDeletar(f.id_funcionario)}
                                disabled={deleteLoading}
                                className="text-xs font-bold text-white bg-red-600 hover:bg-red-700 disabled:opacity-60 px-2.5 py-1 rounded-lg transition-colors">
                                Sim
                              </button>
                              <button
                                onClick={() => setConfirmDelete(null)}
                                disabled={deleteLoading}
                                className="text-xs font-semibold text-slate-600 border border-slate-200 hover:bg-slate-50 px-2.5 py-1 rounded-lg transition-colors">
                                Não
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setEditando(f)}
                                className="text-xs font-semibold text-blue-700 hover:text-blue-900 hover:bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200 transition-colors">
                                Editar
                              </button>
                              <button
                                onClick={() => setConfirmDelete(f.id_funcionario)}
                                className="text-xs font-semibold text-red-600 hover:text-red-800 hover:bg-red-50 px-3 py-1.5 rounded-lg border border-red-200 transition-colors">
                                Excluir
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                    {lista.length === 0 && !loading && (
                      <tr><td colSpan={7} className="px-5 py-8 text-center text-slate-400">
                        {search ? `Nenhum resultado para "${search}".` : 'Nenhum registro encontrado.'}
                      </td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ))}

      {showCriar && (
        <CriarFuncionarioModal
          onClose={() => setShowCriar(false)}
          onSuccess={fetchFuncionarios}
        />
      )}

      {editando && (
        <EditarFuncionarioModal
          funcionario={editando}
          onClose={() => setEditando(null)}
          onSuccess={() => { fetchFuncionarios(search); setEditando(null); }}
        />
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// Tab: Controle de Embarque
// ══════════════════════════════════════════════════════════════════════════════
function DenialModal({ passageiro, onConfirm, onCancel, loading }) {
  const [motivo, setMotivo] = useState('');
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8">
        <h3 className="text-lg font-bold text-slate-800 mb-1">Negar Embarque</h3>
        <p className="text-sm text-slate-500 mb-5">
          Passageiro: <span className="font-semibold text-slate-700">{passageiro}</span>
        </p>
        <textarea value={motivo} onChange={(e) => setMotivo(e.target.value)}
          placeholder="Descreva o motivo do impedimento..." rows={3} autoFocus
          className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none mb-4" />
        <div className="flex gap-3">
          <button onClick={onCancel} disabled={loading}
            className="flex-1 border border-slate-200 text-slate-600 hover:bg-slate-50 py-3 rounded-xl font-semibold text-sm transition-colors">
            Cancelar
          </button>
          <button onClick={() => onConfirm(motivo)} disabled={loading || !motivo.trim()}
            className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white py-3 rounded-xl font-semibold text-sm transition-colors">
            {loading ? 'Negando...' : 'Confirmar Negação'}
          </button>
        </div>
      </div>
    </div>
  );
}

function EmbarqueTab() {
  const [embarques, setEmbarques] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterVoo, setFilterVoo] = useState('');
  const [denialTarget, setDenialTarget] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [paymentLoading, setPaymentLoading] = useState(null);
  const [feedback, setFeedback] = useState('');
  const filterTimer = useRef(null);

  const [voosPresenca, setVoosPresenca] = useState([]);
  const [presencaLoading, setPresencaLoading] = useState(true);
  const [havingFiltro, setHavingFiltro] = useState('presentes');

  const fetchVoosPresenca = useCallback(async (filtro = 'presentes') => {
    setPresencaLoading(true);
    try {
      const { data } = await api.get('/admin/embarque/voos-com-presenca/', { params: { filtro } });
      setVoosPresenca(data.voos || []);
    } catch { /* silently fail */ }
    finally { setPresencaLoading(false); }
  }, []);

  const fetchEmbarques = useCallback(async (voo = '') => {
    setLoading(true);
    try {
      const params = voo ? { num_voo: voo.toUpperCase() } : {};
      const { data } = await api.get('/admin/embarque/', { params });
      setEmbarques(data.embarques || []);
    } catch { /* silently fail */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchEmbarques();
    fetchVoosPresenca(havingFiltro);
  }, [fetchEmbarques, fetchVoosPresenca, havingFiltro]);

  const handleFilterChange = (val) => {
    setFilterVoo(val);
    clearTimeout(filterTimer.current);
    filterTimer.current = setTimeout(() => fetchEmbarques(val), 600);
  };

  const handleAutorizar = async (id_controle) => {
    setActionLoading(id_controle);
    try {
      await api.patch(`/admin/embarque/${id_controle}/autorizar/`);
      setFeedback('Embarque autorizado com sucesso.');
      await Promise.all([fetchEmbarques(filterVoo), fetchVoosPresenca(havingFiltro)]);
    } catch (err) {
      setFeedback(err.response?.data?.error || 'Erro ao autorizar.');
    } finally {
      setActionLoading(null);
      setTimeout(() => setFeedback(''), 3000);
    }
  };

  const handleConfirmarPagamento = async (id_controle) => {
    setPaymentLoading(id_controle);
    try {
      await api.patch(`/admin/embarque/${id_controle}/confirmar-pagamento/`);
      setFeedback('Pagamento confirmado com sucesso.');
      await fetchEmbarques(filterVoo);
    } catch (err) {
      setFeedback(err.response?.data?.error || 'Erro ao confirmar pagamento.');
    } finally {
      setPaymentLoading(null);
      setTimeout(() => setFeedback(''), 3000);
    }
  };

  const handleNegar = async (motivo) => {
    if (!denialTarget) return;
    const { id_controle } = denialTarget;
    setActionLoading(id_controle);
    try {
      await api.patch(`/admin/embarque/${id_controle}/negar/`, { motivo });
      setDenialTarget(null);
      setFeedback('Embarque negado.');
      await fetchEmbarques(filterVoo);
    } catch (err) {
      setFeedback(err.response?.data?.error || 'Erro ao negar.');
    } finally {
      setActionLoading(null);
      setTimeout(() => setFeedback(''), 3000);
    }
  };

  const fmtDT = (s) =>
    s ? new Date(s).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '—';

  const counts = {
    total:            embarques.length,
    presentes:        embarques.filter((e) => e.status_presenca_passageiro === 'Presente').length,
    autorizados:      embarques.filter((e) => e.status_autorizacao === 'Autorizado').length,
    pendentes:        embarques.filter((e) => e.status_autorizacao === 'Pendente').length,
    negados:          embarques.filter((e) => e.status_autorizacao === 'Negado').length,
    pagamentoPendente: embarques.filter((e) => e.status_pagamento === 'Pendente').length,
    pagamentoPago:     embarques.filter((e) => e.status_pagamento === 'Pago').length,
  };

  return (
    <div className="space-y-5">
      {feedback && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-2xl px-5 py-3 font-medium">
          {feedback}
        </div>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {[
          { label: 'Total',          value: counts.total,             cls: 'bg-white text-slate-800' },
          { label: 'Presentes',      value: counts.presentes,         cls: 'bg-emerald-50 text-emerald-700' },
          { label: 'Autorizados',    value: counts.autorizados,       cls: 'bg-emerald-50 text-emerald-700' },
          { label: 'Pend. Embarque', value: counts.pendentes,         cls: 'bg-amber-50 text-amber-700' },
          { label: 'Negados',        value: counts.negados,           cls: 'bg-red-50 text-red-700' },
          { label: 'Pago',           value: counts.pagamentoPago,     cls: 'bg-blue-50 text-blue-700' },
          { label: 'Pend. Pag.',     value: counts.pagamentoPendente, cls: 'bg-orange-50 text-orange-700' },
        ].map((s) => (
          <div key={s.label} className={`${s.cls} border border-slate-100 rounded-2xl p-4 text-center`}>
            <p className="text-2xl font-extrabold leading-none">{s.value}</p>
            <p className="text-xs mt-1 opacity-70 font-medium">{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── Painel HAVING: resumo de voos com filtros configuráveis ── */}
      {(() => {
        const FILTROS = [
          { key: 'presentes',         label: 'Presença no Gate',     col: 'presentes',        badge: 'bg-emerald-100 text-emerald-700' },
          { key: 'embarque_pendente', label: 'Embarque Pendente',    col: 'embarque_pendente', badge: 'bg-amber-100 text-amber-700' },
          { key: 'pag_pendente',      label: 'Pagamento Pendente',   col: 'pag_pendente',      badge: 'bg-orange-100 text-orange-700' },
        ];
        const filtroAtivo = FILTROS.find((f) => f.key === havingFiltro) || FILTROS[0];

        const handleFiltroChange = (key) => {
          setHavingFiltro(key);
          fetchVoosPresenca(key);
        };

        return (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 px-5 py-3.5 border-b border-slate-100 bg-slate-50/60">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-700">Resumo por Voo</span>
                <span className="text-[10px] font-bold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full uppercase tracking-wide">GROUP BY + HAVING</span>
              </div>
              <div className="flex gap-2 sm:ml-auto flex-wrap">
                {FILTROS.map((f) => (
                  <button key={f.key} onClick={() => handleFiltroChange(f.key)}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors border ${
                      havingFiltro === f.key
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'
                    }`}>
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
            {presencaLoading ? (
              <div className="px-5 py-6 text-sm text-slate-400">Carregando...</div>
            ) : voosPresenca.length === 0 ? (
              <div className="px-5 py-6 text-sm text-slate-400">
                Nenhum voo com "{filtroAtivo.label.toLowerCase()}" no momento.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100" style={{ backgroundColor: '#F8FAFC' }}>
                      {['Voo', 'Rota', 'Data', 'Status', 'Total', filtroAtivo.label, ''].map((h) => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {voosPresenca.map((v) => (
                      <tr key={v.num_voo} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-4 py-3">
                          <span className="font-mono text-xs font-bold border border-slate-200 text-slate-600 px-2 py-1 rounded-lg">{v.num_voo}</span>
                        </td>
                        <td className="px-4 py-3 text-slate-600 text-xs whitespace-nowrap">{v.cidade_origem} → {v.cidade_destino}</td>
                        <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">{fmtDate(v.data_partida)}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${(VOO_STATUS_STYLE[v.status_voo] || VOO_STATUS_STYLE.Programado).cls}`}>{v.status_voo}</span>
                        </td>
                        <td className="px-4 py-3 text-center font-bold text-slate-700">{v.total_passageiros}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${filtroAtivo.badge}`}>
                            {v[filtroAtivo.col]}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <button onClick={() => handleFilterChange(v.num_voo)}
                            className="text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap">
                            Ver detalhes ›
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })()}

      <div className="flex items-center gap-3">
        <input type="text" value={filterVoo} onChange={(e) => handleFilterChange(e.target.value)}
          placeholder="🔍 Filtrar por número do voo..."
          className="max-w-sm border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-900 placeholder:text-slate-400" />
        {filterVoo && (
          <button onClick={() => handleFilterChange('')} className="text-slate-400 hover:text-slate-600 text-sm transition-colors">Limpar</button>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? <TableSkeleton rows={5} cols={7} /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100" style={{ backgroundColor: '#F8FAFC' }}>
                  {['Passageiro', 'Documento', 'Voo', 'Rota', 'Data/Hora Gate', 'Assento', 'Classe', 'Presença', 'Autorização', 'Pagamento', 'Impedimento', 'Ações'].map((h) => (
                    <th key={h} className="text-left px-4 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {embarques.map((row) => (
                  <tr key={row.id_controle_embarque} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-4 font-semibold text-slate-800 whitespace-nowrap">{row.nome_passageiro}</td>
                    <td className="px-4 py-4">
                      <span className="font-mono text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-lg">{row.documento_identidade}</span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="font-mono text-xs font-bold border border-slate-200 text-slate-600 px-2 py-1 rounded-lg">{row.num_voo}</span>
                    </td>
                    <td className="px-4 py-4 text-slate-600 text-xs whitespace-nowrap">{row.cidade_origem} → {row.cidade_destino}</td>
                    <td className="px-4 py-4 text-slate-500 text-xs whitespace-nowrap">{fmtDT(row.data_hora_passagem_gate)}</td>
                    <td className="px-4 py-4 font-bold text-slate-700">{row.assento_passageiro}</td>
                    <td className="px-4 py-4 text-xs text-slate-600 whitespace-nowrap">{row.classe_cabine}</td>
                    <td className="px-4 py-4">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${PRESENCA_STYLE[row.status_presenca_passageiro] || 'bg-slate-100 text-slate-600'}`}>
                        {row.status_presenca_passageiro}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${AUTH_STYLE[row.status_autorizacao] || 'bg-slate-100 text-slate-600'}`}>
                        {row.status_autorizacao}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${PAG_STYLE[row.status_pagamento] || 'bg-slate-100 text-slate-600'}`}>
                        {row.status_pagamento || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      {row.motivo_impedimento_embarque
                        ? <span className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded-lg max-w-[180px] block truncate" title={row.motivo_impedimento_embarque}>⚠️ {row.motivo_impedimento_embarque}</span>
                        : <span className="text-slate-300 text-xs">—</span>}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-col gap-1.5">
                        {row.status_autorizacao === 'Pendente' && (
                          <div className="flex gap-2 whitespace-nowrap">
                            <button onClick={() => handleAutorizar(row.id_controle_embarque)}
                              disabled={actionLoading === row.id_controle_embarque}
                              className="text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg transition-colors">
                              {actionLoading === row.id_controle_embarque ? '...' : '✓ Autorizar'}
                            </button>
                            <button onClick={() => setDenialTarget({ id_controle: row.id_controle_embarque, nome_passageiro: row.nome_passageiro })}
                              disabled={actionLoading === row.id_controle_embarque}
                              className="text-xs font-semibold bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg transition-colors">
                              ✗ Negar
                            </button>
                          </div>
                        )}
                        {row.status_pagamento === 'Pendente' && (
                          <button onClick={() => handleConfirmarPagamento(row.id_controle_embarque)}
                            disabled={paymentLoading === row.id_controle_embarque}
                            className="text-xs font-semibold bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap">
                            {paymentLoading === row.id_controle_embarque ? '...' : '$ Confirmar Pago'}
                          </button>
                        )}
                        {row.status_autorizacao !== 'Pendente' && row.status_pagamento !== 'Pendente' && (
                          <span className="text-slate-300 text-xs">—</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {embarques.length === 0 && !loading && (
                  <tr><td colSpan={12} className="px-5 py-16 text-center text-slate-400">
                    {filterVoo ? `Nenhum registro para o voo "${filterVoo.toUpperCase()}".` : 'Nenhum registro de embarque encontrado.'}
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {denialTarget && (
        <DenialModal
          passageiro={denialTarget.nome_passageiro}
          onConfirm={handleNegar}
          onCancel={() => setDenialTarget(null)}
          loading={actionLoading === denialTarget.id_controle}
        />
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// Page: DashboardAdmin
// ══════════════════════════════════════════════════════════════════════════════
export default function DashboardAdmin() {
  const { user } = useAuth();
  const [tab, setTab] = useState('voos');

  const [voos, setVoos] = useState([]);
  const [voosTotal, setVoosTotal] = useState(0);
  const [voosLoading, setVoosLoading] = useState(true);

  const [passageiros, setPassageiros] = useState([]);
  const [passageirosTotal, setPassageirosTotal] = useState(0);
  const [passageirosLoading, setPassageirosLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  const fetchVoos = useCallback(async (busca = '') => {
    setVoosLoading(true);
    try {
      const { data } = await api.get('/admin/voos/', { params: busca ? { busca } : {} });
      setVoos(data.voos || []);
      setVoosTotal(data.total || 0);
    } catch {
      setError('Erro ao carregar voos.');
    } finally {
      setVoosLoading(false);
    }
  }, []);

  const handleVooSearch = useCallback((busca) => fetchVoos(busca), [fetchVoos]);

  useEffect(() => { fetchVoos(); }, [fetchVoos]);

  const fetchPassageiros = useCallback(async (busca = '') => {
    setPassageirosLoading(true);
    try {
      const { data } = await api.get('/admin/passageiros/', { params: busca ? { busca } : {} });
      setPassageiros(data.passageiros || []);
      setPassageirosTotal(data.total || 0);
    } catch {
      setError('Erro ao carregar passageiros.');
    } finally {
      setPassageirosLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => fetchPassageiros(search), search ? 500 : 0);
    return () => clearTimeout(t);
  }, [search, fetchPassageiros]);

  const emVoo = voos.filter((v) => v.status_voo === 'Em Voo').length;

  const TABS = [
    { key: 'voos',       label: '✈ Voos',                  count: voosTotal },
    { key: 'passageiros',label: '👤 Passageiros',           count: passageirosTotal },
    { key: 'tripulacao', label: '🧑‍✈️ Tripulação',           count: null },
    { key: 'embarque',   label: '🚪 Controle de Embarque',  count: null },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="py-10 px-4"
        style={{ background: 'linear-gradient(160deg, #070E1A 0%, #0F2044 55%, #1A3869 100%)' }}>
        <div className="max-w-7xl mx-auto">
          <p className="text-blue-300 text-sm mb-1">Painel Administrativo — Backoffice</p>
          <h1 className="text-3xl font-extrabold text-white">{user?.nome}</h1>

          <div className="grid grid-cols-3 gap-4 mt-7">
            {[
              { icon: '✈', value: voosTotal, label: 'Total de Voos' },
              { icon: '🟢', value: emVoo,    label: 'Em Voo Agora' },
              { icon: '👤', value: passageirosTotal, label: 'Passageiros' },
            ].map((s) => (
              <div key={s.label} className="bg-white/10 border border-white/10 rounded-2xl p-4">
                <span className="text-2xl">{s.icon}</span>
                <p className="text-2xl font-bold text-white mt-2 leading-tight">{s.value}</p>
                <p className="text-blue-300 text-xs mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Content ─────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-red-700 text-sm mb-6">{error}</div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 border-b border-slate-200 mb-6 overflow-x-auto">
          {TABS.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
                tab === t.key
                  ? 'border-blue-900 text-blue-900'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}>
              {t.label}
              {t.count !== null && (
                <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                  tab === t.key ? 'text-white' : 'bg-slate-100 text-slate-500'
                }`} style={tab === t.key ? { backgroundColor: '#0F2044' } : {}}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {tab === 'voos' && (
          <VoosTab
            voos={voos}
            loading={voosLoading}
            onVooCreated={fetchVoos}
            onSearch={handleVooSearch}
          />
        )}
        {tab === 'passageiros' && (
          <PassageirosTab
            passageiros={passageiros} loading={passageirosLoading}
            search={search} onSearch={setSearch}
          />
        )}
        {tab === 'tripulacao' && <TripulacaoTab />}
        {tab === 'embarque'   && <EmbarqueTab />}
      </div>
    </div>
  );
}
