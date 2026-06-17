import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

function readUserFromStorage() {
  const token = localStorage.getItem('access_token');
  const role  = localStorage.getItem('role');
  const nome  = localStorage.getItem('nome');
  return token && role ? { token, role, nome } : null;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setUser(readUserFromStorage());
    setLoading(false);

    // Sincroniza quando outra aba altera o localStorage (ex: login de admin)
    const handleStorage = (e) => {
      if (['access_token', 'role', 'nome'].includes(e.key)) {
        setUser(readUserFromStorage());
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const login = (data) => {
    localStorage.setItem('access_token', data.access);
    if (data.refresh) localStorage.setItem('refresh_token', data.refresh);
    localStorage.setItem('role', data.role);
    localStorage.setItem('nome', data.nome);
    setUser({ token: data.access, role: data.role, nome: data.nome });
  };

  const logout = () => {
    localStorage.clear();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
