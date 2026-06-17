import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

import HomePublica        from './pages/HomePublica';
import Login              from './pages/Login';
import Cadastro           from './pages/Cadastro';
import DashboardPassageiro from './pages/DashboardPassageiro';
import AdminSetup         from './pages/AdminSetup';
import AdminLogin         from './pages/AdminLogin';
import DashboardAdmin     from './pages/DashboardAdmin';

// Layout com Navbar — usado apenas pelo escopo público/passageiro
function PublicLayout() {
  return (
    <>
      <Navbar />
      <Outlet />
    </>
  );
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      {/* ══════════════════════════════════════════════════════════════════
          ESCOPO PÚBLICO / PASSAGEIRO  (com Navbar)
          Raiz: /
      ══════════════════════════════════════════════════════════════════ */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePublica />} />

        <Route
          path="/login"
          element={
            user?.role === 'passenger'
              ? <Navigate to="/passageiro" replace />
              : user?.role === 'admin'
              ? <Navigate to="/admin/dashboard" replace />
              : <Login />
          }
        />

        <Route
          path="/cadastro"
          element={user ? <Navigate to="/passageiro" replace /> : <Cadastro />}
        />

        <Route
          path="/passageiro"
          element={
            <ProtectedRoute role="passenger">
              <DashboardPassageiro />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* ══════════════════════════════════════════════════════════════════
          ESCOPO ADMIN  (sem Navbar — layout próprio)
          Raiz: /admin
      ══════════════════════════════════════════════════════════════════ */}

      {/* Rota secreta de setup — verifica se admin existe antes de exibir */}
      <Route path="/admin/setup" element={<AdminSetup />} />

      {/* Login isolado do admin */}
      <Route
        path="/admin/login"
        element={
          user?.role === 'admin'
            ? <Navigate to="/admin/dashboard" replace />
            : <AdminLogin />
        }
      />

      {/* Dashboard protegido */}
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute role="admin">
            <DashboardAdmin />
          </ProtectedRoute>
        }
      />

      {/* /admin → redireciona para dashboard (ou login se não autenticado) */}
      <Route
        path="/admin"
        element={
          user?.role === 'admin'
            ? <Navigate to="/admin/dashboard" replace />
            : <Navigate to="/admin/login" replace />
        }
      />

      {/* Qualquer rota desconhecida → raiz pública */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
