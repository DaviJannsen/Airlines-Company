import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav
      className="text-white shadow-lg sticky top-0 z-40"
      style={{ backgroundColor: '#0F2044' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <span className="text-2xl group-hover:translate-x-0.5 transition-transform duration-200">
              ✈
            </span>
            <div className="leading-none">
              <span className="font-extrabold text-xl tracking-tight">Airlines</span>
              <span className="font-extrabold text-xl text-red-400"> Co.</span>
            </div>
          </Link>

          {/* Right side */}
          <div className="flex items-center gap-5">
            <Link
              to="/"
              className="text-blue-200 hover:text-white transition-colors text-sm font-medium"
            >
              Voos
            </Link>

            {!user && (
              <Link
                to="/login"
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
              >
                Entrar
              </Link>
            )}

            {user?.role === 'passenger' && (
              <>
                <Link
                  to="/passageiro"
                  className="text-blue-200 hover:text-white transition-colors text-sm font-medium"
                >
                  Minhas Reservas
                </Link>
                <div className="flex items-center gap-3 pl-4 border-l border-blue-800">
                  <div className="text-right leading-tight">
                    <p className="text-xs text-blue-400">Passageiro</p>
                    <p className="text-sm font-semibold">{user.nome?.split(' ')[0]}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="text-blue-300 hover:text-white text-xs transition-colors"
                  >
                    Sair
                  </button>
                </div>
              </>
            )}

            {user?.role === 'admin' && (
              <>
                <Link
                  to="/admin"
                  className="text-blue-200 hover:text-white transition-colors text-sm font-medium"
                >
                  Painel Admin
                </Link>
                <div className="flex items-center gap-3 pl-4 border-l border-blue-800">
                  <div className="text-right leading-tight">
                    <p className="text-xs text-blue-400">Funcionário</p>
                    <p className="text-sm font-semibold">{user.nome?.split(' ')[0]}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="text-blue-300 hover:text-white text-xs transition-colors"
                  >
                    Sair
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
