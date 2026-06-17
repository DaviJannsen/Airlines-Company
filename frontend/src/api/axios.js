import axios from 'axios';

const BASE = 'http://127.0.0.1:8000/api';

const api = axios.create({
  baseURL: BASE,
  headers: { 'Content-Type': 'application/json' },
});

// Injeta Bearer token em toda requisição autenticada
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Ao receber 401: tenta refresh antes de deslogar
let isRefreshing = false;
let refreshQueue = [];

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    // Não tenta refresh para os próprios endpoints de auth
    const isAuthEndpoint =
      original.url?.includes('/auth/login/') ||
      original.url?.includes('/auth/cadastro/') ||
      original.url?.includes('/auth/refresh/');

    // 403 = token de papel errado (sessão inválida ou token trocado)
    if (error.response?.status === 403 && !isAuthEndpoint) {
      const role = localStorage.getItem('role');
      localStorage.clear();
      window.location.href = role === 'admin' ? '/admin/login' : '/login';
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !original._retry && !isAuthEndpoint) {
      const refreshToken = localStorage.getItem('refresh_token');

      if (!refreshToken) {
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // Outros pedidos aguardam o refresh em andamento
        return new Promise((resolve, reject) => {
          refreshQueue.push({ resolve, reject });
        }).then((token) => {
          original.headers.Authorization = `Bearer ${token}`;
          return api(original);
        });
      }

      original._retry = true;
      isRefreshing = true;

      try {
        const { data } = await axios.post(`${BASE}/auth/refresh/`, {
          refresh: refreshToken,
        });
        const newToken = data.access;
        localStorage.setItem('access_token', newToken);
        api.defaults.headers.common.Authorization = `Bearer ${newToken}`;
        refreshQueue.forEach(({ resolve }) => resolve(newToken));
        refreshQueue = [];
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      } catch {
        refreshQueue.forEach(({ reject }) => reject(error));
        refreshQueue = [];
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(error);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
