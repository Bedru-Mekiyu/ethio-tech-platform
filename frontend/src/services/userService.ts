import { api, type ApiResponse } from "./api";
import type { AuthUser } from "@/store/authStore";
import { compressImage } from "@/lib/image";

export interface SystemAvatarOption {
  id: string;
  role: "student" | "mentor";
  label: string;
  alt: string;
  url: string;
}

interface UserPayload extends AuthUser {
  _id?: string;
}

function normalizeUser(raw: UserPayload): AuthUser {
  const avatar = raw.avatarUrl ?? raw.avatar ?? null;
  return {
    ...raw,
    id: raw.id ?? raw._id ?? "",
    avatar: avatar ?? undefined,
    avatarUrl: avatar ?? undefined,
    avatarType: raw.avatarType ?? (avatar?.startsWith("/avatars/") ? "default" : "uploaded"),
    avatarSource: raw.avatarSource ?? (avatar?.startsWith("/avatars/") ? "system" : "cloudinary"),
  };
}

export const getMyProfile = async (): Promise<AuthUser> => {
  const { data } = await api.get<ApiResponse<{ user: AuthUser }>>("/users/me");
  return normalizeUser(data.data.user);
};

export const getAvatarOptions = async (): Promise<SystemAvatarOption[]> => {
  const { data } = await api.get<ApiResponse<{ avatars: SystemAvatarOption[] }>>("/users/me/avatars");
  return data.data.avatars;
};

export const updateMyProfile = async (payload: {
  fullName?: string;
  bio?: string;
  phone?: string;
  gradeLevel?: number;
  expertise?: string[];
  currentCompany?: string;
}) => {
  const { data } = await api.patch<ApiResponse<{ user: AuthUser }>>("/users/me", payload);
  return normalizeUser(data.data.user);
};

export const uploadAvatar = async (file: File, onProgress?: (percent: number) => void) => {
  const compressed = await compressImage(file, 512, 0.84);
  const fd = new FormData();
  fd.append("avatar", compressed, compressed.name || "avatar.webp");
  onProgress?.(10);
  const { data } = await api.post<ApiResponse<{ user: AuthUser }>>("/users/me/avatar", fd, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: (e) => {
      if (!e.total) return;
      onProgress?.(10 + Math.round((e.loaded / e.total) * 90));
    },
  });
  onProgress?.(100);
  return normalizeUser(data.data.user);
};

export const selectSystemAvatar = async (avatarId: string) => {
  const { data } = await api.patch<ApiResponse<{ user: AuthUser; avatar: SystemAvatarOption }>>(
    `/users/me/avatar/default/${avatarId}`
  );
  return normalizeUser(data.data.user);
};

export const removeAvatar = async () => {
  const { data } = await api.delete<ApiResponse<{ user: AuthUser }>>("/users/me/avatar");
  return normalizeUser(data.data.user);
};

