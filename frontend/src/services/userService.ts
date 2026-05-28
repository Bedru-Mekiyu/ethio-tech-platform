import { api, type ApiResponse } from "./api";
import type { AuthUser } from "@/store/authStore";

export const updateMyProfile = async (payload: {
  fullName?: string;
  bio?: string;
  phone?: string;
  gradeLevel?: number;
  expertise?: string[];
  currentCompany?: string;
}) => {
  const { data } = await api.patch<ApiResponse<{ user: AuthUser }>>("/users/me", payload);
  return data.data.user;
};

export const uploadAvatar = async (file: File, onProgress?: (percent: number) => void) => {
  const fd = new FormData();
  fd.append("avatar", file);
  const { data } = await api.post<ApiResponse<{ user: AuthUser }>>("/users/me/avatar", fd, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: (e) => {
      if (!e.total) return;
      const pct = Math.round((e.loaded / e.total) * 100);
      onProgress?.(pct);
    },
  });
  return data.data.user;
};
