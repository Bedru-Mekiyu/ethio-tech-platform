import { api, type ApiResponse } from "./api";
import type { AuthUser } from "@/store/authStore";

export async function login(email: string, password: string) {
  const { data } = await api.post<
    ApiResponse<{ accessToken: string; refreshToken: string; user: AuthUser }>
  >("/auth/login", { email, password });
  return data.data;
}

export async function register(payload: {
  fullName: string;
  email: string;
  password: string;
  role?: string;
  gradeLevel?: number;
}) {
  const { data } = await api.post<ApiResponse<{ user: AuthUser }>>("/auth/register", payload);
  return data.data;
}

export async function fetchMe() {
  const { data } = await api.get<ApiResponse<{ user: AuthUser }>>("/auth/me");
  return data.data.user;
}

export async function logoutApi() {
  await api.post("/auth/logout");
}
