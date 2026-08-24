import axios, { type AxiosRequestConfig } from 'axios';
import {
  getAccessToken,
  setAccessToken,
} from './tokenStore';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000/api' : '/api'),
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

interface RetriableConfig extends AxiosRequestConfig {
  _retry?: boolean;
}

let isRefreshing = false;
let refreshQueue: Array<(token: string | null) => void> = [];

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config as RetriableConfig | undefined;
    const status = error.response?.status;

    if (
      status === 401 &&
      original &&
      !original._retry &&
      !String(original.url).includes('/auth/refresh') &&
      !String(original.url).includes('/auth/login')
    ) {
      original._retry = true;

      if (isRefreshing) {
        return new Promise((resolve) => {
          refreshQueue.push((token) => {
            if (token && original.headers) {
              original.headers.Authorization = `Bearer ${token}`;
            }
            resolve(api(original));
          });
        });
      }

      isRefreshing = true;
      try {
        const { data } = await api.post('/auth/refresh');
        const token = data?.data?.accessToken as string;
        setAccessToken(token);
        refreshQueue.forEach((resolve) => resolve(token));
        refreshQueue = [];
        if (original.headers) {
          original.headers.Authorization = `Bearer ${token}`;
        }
        return api(original);
      } catch (refreshError) {
        setAccessToken(null);
        refreshQueue.forEach((resolve) => resolve(null));
        refreshQueue = [];
        window.dispatchEvent(new CustomEvent('auth:unauthorized'));
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    if (status === 401) {
      window.dispatchEvent(new CustomEvent('auth:unauthorized'));
    }
    return Promise.reject(error);
  }
);

export default api;
