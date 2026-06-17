import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="text-5xl mb-4 animate-bounce">✈</div>
          <p className="text-slate-400 text-sm">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return role === 'admin'
      ? <Navigate to="/admin/login" replace />
      : <Navigate to="/login" replace />;
  }

  if (role && user.role !== role) {
    return user.role === 'admin'
      ? <Navigate to="/admin/dashboard" replace />
      : <Navigate to="/passageiro" replace />;
  }

  return children;
}
