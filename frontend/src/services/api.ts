import axios, { AxiosHeaders } from "axios";
import { useAuthStore } from "@/store/authStore";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5000/api/v1";

export const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 15_000,
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    const headers = AxiosHeaders.from(config.headers);
    headers.set("Authorization", `Bearer ${token}`);
    config.headers = headers;
  }
  return config;
});

let refreshing: Promise<string | null> | null = null;

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status !== 401 || original._retry) {
      return Promise.reject(error);
    }
    original._retry = true;

    if (!refreshing) {
      refreshing = (async () => {
        const refreshToken = useAuthStore.getState().refreshToken;
        if (!refreshToken) return null;
        try {
          const { data } = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
          const payload = data.data ?? data;
          useAuthStore.getState().setTokens(payload.accessToken, payload.refreshToken);
          return payload.accessToken as string;
        } catch {
          if (typeof navigator === "undefined" || navigator.onLine) {
            useAuthStore.getState().logout();
          }
          return null;
        } finally {
          refreshing = null;
        }
      })();
    }

    const newToken = await refreshing;
    if (!newToken) return Promise.reject(error);
    const headers = AxiosHeaders.from(original.headers);
    headers.set("Authorization", `Bearer ${newToken}`);
    original.headers = headers;
    return api(original);
  }
);

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}
