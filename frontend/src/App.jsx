import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Cadastro from './pages/Cadastro';
import HomePublica from './pages/HomePublica';
import DashboardPassageiro from './pages/DashboardPassageiro';
import DashboardAdmin from './pages/DashboardAdmin';

function AppRoutes() {
  const { user } = useAuth();

  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePublica />} />

        <Route
          path="/login"
          element={
            user ? (
              <Navigate to={user.role === 'admin' ? '/admin' : '/passageiro'} replace />
            ) : (
              <Login />
            )
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

        <Route
          path="/admin"
          element={
            <ProtectedRoute role="admin">
              <DashboardAdmin />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
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
