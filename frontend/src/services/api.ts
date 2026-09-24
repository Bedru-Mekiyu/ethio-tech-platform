import axios, { AxiosHeaders } from "axios";
import { useAuthStore } from "@/store/authStore";
import { getBackendApiUrl, getBackendOrigin } from "@/config/runtime";

export const API_URL = getBackendApiUrl();
export const API_ORIGIN = getBackendOrigin();

export const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 30_000,
  withCredentials: true,
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
    if (!original) return Promise.reject(error);

    const isAuthRoute =
      original.url?.includes("/auth/login") ||
      original.url?.includes("/auth/register") ||
      original.url?.includes("/auth/refresh");

    if (error.response?.status !== 401 || original._retry || isAuthRoute) {
      return Promise.reject(error);
    }
    original._retry = true;

    if (!refreshing) {
      refreshing = (async () => {
        try {
          const { data } = await axios.post(
            `${API_URL}/auth/refresh`,
            {},
            { withCredentials: true, timeout: 15_000 }
          );
          const payload = data.data ?? data;
          useAuthStore.getState().setAccessToken(payload.accessToken);
          return payload.accessToken as string;
        } catch (refreshErr: unknown) {
          const status = (refreshErr as { response?: { status?: number } })?.response?.status;
          // Only log out if server explicitly rejected the refresh token (401/403)
          if (status === 401 || status === 403) {
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
