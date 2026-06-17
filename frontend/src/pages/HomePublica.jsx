import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/axios';

const STATUS_STYLE = {
  Programado: { cls: 'bg-blue-100 text-blue-700', dot: 'bg-blue-500' },
  'Em Voo': { cls: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
  Concluído: { cls: 'bg-slate-100 text-slate-500', dot: 'bg-slate-400' },
  Cancelado: { cls: 'bg-red-100 text-red-700', dot: 'bg-red-500' },
  Atrasado: { cls: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500' },
};

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

function FlightCard({ voo }) {
  const st = STATUS_STYLE[voo.status_voo] || STATUS_STYLE.Programado;
  const chegada = voo.previsao_chegada
    ? new Date(voo.previsao_chegada).toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
      })
    : '—';

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 pt-5 pb-2">
        <span className="font-mono text-xs font-bold text-slate-400 bg-slate-50 border border-slate-200 px-2 py-1 rounded-lg">
          {voo.num_voo}
        </span>
        <div className="flex items-center gap-2">
          <span
            className={`text-xs px-2 py-0.5 rounded-lg font-medium ${
              voo.tipo_voo === 'Internacional'
                ? 'bg-purple-100 text-purple-700'
                : 'bg-sky-100 text-sky-700'
            }`}
          >
            {voo.tipo_voo}
          </span>
          <span
            className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${st.cls}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
            {voo.status_voo}
          </span>
        </div>
      </div>

      {/* Route */}
      <div className="px-5 py-4 flex-1">
        <div className="flex items-center gap-2">
          {/* Origin */}
          <div className="flex-1 text-center">
            <p className="text-3xl font-black text-slate-800 tracking-tight">
              {voo.iata_origem}
            </p>
            <p className="text-sm font-semibold text-slate-600 mt-0.5 leading-tight">
              {voo.cidade_origem}
            </p>
            <p className="text-xs text-slate-400">{voo.pais_origem}</p>
            <p className="text-lg font-bold mt-2" style={{ color: '#0F2044' }}>
              {fmtTime(voo.hora_partida)}
            </p>
          </div>

          {/* Arrow */}
          <div className="flex-shrink-0 flex flex-col items-center gap-1 px-1">
            {voo.distancia_km && (
              <span className="text-xs text-slate-400">
                {Number(voo.distancia_km).toLocaleString('pt-BR')} km
              </span>
            )}
            <div className="flex items-center gap-1">
              <div className="w-6 h-px bg-slate-200" />
              <span className="text-slate-300">✈</span>
              <div className="w-6 h-px bg-slate-200" />
            </div>
            <span className="text-xs text-slate-400 whitespace-nowrap">
              {voo.tipo_trecho || 'Direto'}
            </span>
          </div>

          {/* Destination */}
          <div className="flex-1 text-center">
            <p className="text-3xl font-black text-slate-800 tracking-tight">
              {voo.iata_destino}
            </p>
            <p className="text-sm font-semibold text-slate-600 mt-0.5 leading-tight">
              {voo.cidade_destino}
            </p>
            <p className="text-xs text-slate-400">{voo.pais_destino}</p>
            <p className="text-lg font-bold mt-2" style={{ color: '#0F2044' }}>
              {chegada}
            </p>
          </div>
        </div>
      </div>

      {/* Capacity badge */}
      {voo.capacidade_total != null && (
        <div className="px-5 pb-1">
          {voo.assentos_restantes <= 0 ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-red-100 text-red-700 w-full justify-center">
              🚫 LOTADO
            </span>
          ) : voo.assentos_restantes <= 10 ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-amber-100 text-amber-700 w-full justify-center">
              ⚡ Últimos {voo.assentos_restantes} assentos!
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 w-full justify-center">
              ✓ {voo.assentos_restantes} assentos disponíveis
            </span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="border-t border-slate-100 px-5 py-3 flex items-center justify-between">
        <span className="text-xs text-slate-400">📅 {fmtDate(voo.data_partida)}</span>
        <span className="text-xs text-slate-400 font-mono">{voo.cod_aeronave}</span>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 animate-pulse">
      <div className="flex justify-between mb-5">
        <div className="h-5 w-16 bg-slate-100 rounded-lg" />
        <div className="h-5 w-20 bg-slate-100 rounded-full" />
      </div>
      <div className="flex items-center gap-4 mb-5">
        <div className="flex-1 space-y-2">
          <div className="h-8 bg-slate-100 rounded-lg" />
          <div className="h-3 w-3/4 bg-slate-100 rounded mx-auto" />
          <div className="h-4 w-1/2 bg-slate-100 rounded mx-auto" />
        </div>
        <div className="flex-shrink-0 w-8">
          <div className="h-px bg-slate-100 w-full" />
        </div>
        <div className="flex-1 space-y-2">
          <div className="h-8 bg-slate-100 rounded-lg" />
          <div className="h-3 w-3/4 bg-slate-100 rounded mx-auto" />
          <div className="h-4 w-1/2 bg-slate-100 rounded mx-auto" />
        </div>
      </div>
      <div className="h-3 w-1/3 bg-slate-100 rounded" />
    </div>
  );
}

export default function HomePublica() {
  const { user } = useAuth();
  const [voos, setVoos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    origem: '',
    destino: '',
    data: '',
    tipo_voo: '',
  });

  const fetchVoos = useCallback(async (f) => {
    setLoading(true);
    setError('');
    try {
      const params = Object.fromEntries(Object.entries(f).filter(([, v]) => v));
      const { data } = await api.get('/voos/', { params });
      setVoos(Array.isArray(data) ? data : []);
    } catch {
      setError(
        'Não foi possível conectar ao servidor. Verifique se o backend está em execução.'
      );
      setVoos([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVoos({});
  }, [fetchVoos]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchVoos(filters);
  };

  const clearFilters = () => {
    const empty = { origem: '', destino: '', data: '', tipo_voo: '' };
    setFilters(empty);
    fetchVoos(empty);
  };

  const hasFilters = Object.values(filters).some(Boolean);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <div
        className="py-16 px-4"
        style={{
          background: 'linear-gradient(160deg, #070E1A 0%, #0F2044 55%, #1A3869 100%)',
        }}
      >
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-extrabold text-white mb-2 tracking-tight">
              Encontre seu próximo voo
            </h1>
            <p className="text-blue-200 text-lg font-light">
              Explore nossa malha de destinos nacionais e internacionais
            </p>
          </div>

          {/* Search form */}
          <form onSubmit={handleSearch} className="bg-white rounded-2xl shadow-2xl p-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Origem */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                  Origem (IATA)
                </label>
                <input
                  type="text"
                  maxLength={3}
                  placeholder="Ex: GRU"
                  value={filters.origem}
                  onChange={(e) =>
                    setFilters((f) => ({ ...f, origem: e.target.value.toUpperCase() }))
                  }
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900 uppercase"
                />
              </div>

              {/* Destino */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                  Destino (IATA)
                </label>
                <input
                  type="text"
                  maxLength={3}
                  placeholder="Ex: JFK"
                  value={filters.destino}
                  onChange={(e) =>
                    setFilters((f) => ({ ...f, destino: e.target.value.toUpperCase() }))
                  }
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900 uppercase"
                />
              </div>

              {/* Data */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                  Data de Partida
                </label>
                <input
                  type="date"
                  value={filters.data}
                  onChange={(e) => setFilters((f) => ({ ...f, data: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900"
                />
              </div>

              {/* Tipo */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                  Tipo de Voo
                </label>
                <select
                  value={filters.tipo_voo}
                  onChange={(e) => setFilters((f) => ({ ...f, tipo_voo: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900 bg-white"
                >
                  <option value="">Todos os tipos</option>
                  <option value="Nacional">Nacional</option>
                  <option value="Internacional">Internacional</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-4">
              {hasFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-slate-500 hover:text-slate-700 text-sm px-3 py-2 transition-colors"
                >
                  Limpar filtros
                </button>
              )}
              <button
                type="submit"
                className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-xl text-sm font-semibold transition-colors"
              >
                🔍 Buscar Voos
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* ── Results ───────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold text-slate-800">
              {loading
                ? 'Carregando voos...'
                : `${voos.length} voo${voos.length !== 1 ? 's' : ''} ${
                    hasFilters ? 'encontrado' : 'disponível'
                  }${voos.length !== 1 ? 's' : ''}`}
            </h2>
            {hasFilters && !loading && (
              <p className="text-xs text-slate-400 mt-0.5">
                Resultados filtrados —{' '}
                <button onClick={clearFilters} className="text-blue-600 hover:underline">
                  ver todos
                </button>
              </p>
            )}
          </div>

          {!user && (
            <Link
              to="/login"
              style={{ backgroundColor: '#0F2044' }}
              className="text-sm text-white px-4 py-2 rounded-xl hover:opacity-90 transition-opacity"
            >
              Entrar para reservar ✈
            </Link>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-5 text-red-700 text-sm mb-6">
            <p className="font-semibold mb-1">Erro de conexão</p>
            <p>{error}</p>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : voos.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-6xl mb-4">🔍</p>
            <h3 className="text-xl font-bold text-slate-700 mb-2">
              Nenhum voo encontrado
            </h3>
            <p className="text-slate-400 text-sm">
              Tente outros filtros ou limpe a busca.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {voos.map((voo) => (
              <FlightCard key={voo.num_voo} voo={voo} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
