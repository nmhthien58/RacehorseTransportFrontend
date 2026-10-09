import axios from 'axios';
import { useAuthStore } from '@features/auth/store/authStore';

const isMock = import.meta.env.VITE_USE_MOCK === 'true';

const resolveBaseUrl = () => {
  if (isMock) return '/api';
  const envUrl =
    import.meta.env.VITE_API_URL ||
    import.meta.env.VITE_API_BASE_URL ||
    'https://racehorsetransportbackend-production.up.railway.app';
  const clean = envUrl.replace(/\/+$/, '');
  return clean.endsWith('/api') ? clean : `${clean}/api`;
};

const api = axios.create({
  baseURL: resolveBaseUrl(),
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

/**
 * Lấy Refresh token đồng bộ với authStore
 * @returns {string | null}
 */
const getRefreshToken = () => {
  const storeRefreshToken = useAuthStore.getState?.()?.refreshToken;
  if (storeRefreshToken) return storeRefreshToken;

  try {
    const rawStorage = localStorage.getItem('auth-storage');
    if (rawStorage) {
      const parsed = JSON.parse(rawStorage);
      return parsed?.state?.refreshToken || null;
    }
  } catch {
    return null;
  }
  return null;
};

// Request interceptor - tự động gắn token
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

// Biến lưu trữ promise refresh token tránh gọi trùng lặp khi nhiều request đồng thời
let refreshPromise = null;

// Response interceptor - trả về response.data và tự động refresh token khi 401
api.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const originalRequest = error.config;

    // Xử lý tự động refresh token khi gặp lỗi 401 (chưa retry)
    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry
    ) {
      const refreshToken = getRefreshToken();

      if (refreshToken) {
        originalRequest._retry = true;

        try {
          if (!refreshPromise) {
            refreshPromise = axios.post(`${resolveBaseUrl()}/auth/refresh`, {
              refreshToken,
            });
          }

          const refreshRes = await refreshPromise;
          const refreshData = refreshRes.data?.data || refreshRes.data;
          const newAccessToken = refreshData?.accessToken;
          const newRefreshToken = refreshData?.refreshToken || refreshToken;

          if (newAccessToken) {
            useAuthStore.getState?.()?.setTokens?.(newAccessToken, newRefreshToken);
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            return api(originalRequest);
          }
        } catch (refreshErr) {
          useAuthStore.getState?.()?.logout?.();
          return Promise.reject(refreshErr);
        } finally {
          refreshPromise = null;
        }
      } else {
        useAuthStore.getState?.()?.logout?.();
      }
    }

    const errorBody = error.response?.data;
    let message = 'Có lỗi xảy ra';

    if (errorBody) {
      if (errorBody.message === 'Validation failed' && Array.isArray(errorBody.errors) && errorBody.errors.length) {
        message = errorBody.errors.join('\n');
      } else if (errorBody.message) {
        message = errorBody.message;
      }
    } else if (error.message) {
      message = error.message;
    }

    console.error('API Error:', message);
    return Promise.reject(error);
  },
);

export default api;
