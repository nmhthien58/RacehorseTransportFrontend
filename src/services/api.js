import axios from 'axios';
import { useAuthStore } from '@features/auth/store/authStore';

const isMock = import.meta.env.VITE_USE_MOCK === 'true';

const api = axios.create({
  baseURL: isMock
    ? '/api'
    : import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Lấy Bearer token đồng bộ với authStore (Zustand persist key: 'auth-storage')
 * @returns {string | null}
 */
const getAuthToken = () => {
  const storeToken = useAuthStore.getState?.()?.token;
  if (storeToken) return storeToken;

  try {
    const rawStorage = localStorage.getItem('auth-storage');
    if (rawStorage) {
      const parsed = JSON.parse(rawStorage);
      return parsed?.state?.token || null;
    }
  } catch {
    return null;
  }
  return null;
};

// Request interceptor - tự động thêm token
api.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor - xử lý lỗi chung
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState?.()?.logout?.();
    }
    const message = error.response?.data?.message || error.message || 'Có lỗi xảy ra';
    console.error('API Error:', message);
    return Promise.reject(error);
  },
);

export default api;
