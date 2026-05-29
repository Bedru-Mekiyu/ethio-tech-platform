import { api, type ApiResponse } from "./api";
import type { AuthUser } from "@/store/authStore";
import { compressImage } from "@/lib/image";

function normalizeUser(raw: AuthUser & { _id?: string }): AuthUser {
  return {
    ...raw,
    id: raw.id ?? raw._id ?? "",
  };
}

export const getMyProfile = async (): Promise<AuthUser> => {
  const { data } = await api.get<ApiResponse<{ user: AuthUser }>>("/users/me");
  return normalizeUser(data.data.user);
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

/** Server multipart fallback when Cloudinary sign is unavailable */
const uploadAvatarViaServer = async (file: File, onProgress?: (percent: number) => void) => {
  const compressed = await compressImage(file, 512, 0.8);
  const fd = new FormData();
  fd.append("avatar", compressed, compressed.name || "avatar.jpg");
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

export const uploadAvatar = async (file: File, onProgress?: (percent: number) => void) => {
  const compressed = await compressImage(file, 512, 0.8);

  try {
    const { data: signData } = await api.get<
      ApiResponse<{ signature: string; timestamp: number; apiKey: string; cloudName: string; folder: string }>
    >("/users/me/avatar/sign");
    const { signature, timestamp, apiKey, cloudName, folder } = signData.data;

    const fd = new FormData();
    fd.append("file", compressed);
    fd.append("api_key", apiKey);
    fd.append("timestamp", String(timestamp));
    fd.append("signature", signature);
    if (folder) fd.append("folder", folder);

    const cloudUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
    const res = await import("axios").then(({ default: axios }) =>
      axios.post(cloudUrl, fd, {
        onUploadProgress: (e: { total?: number; loaded: number }) => {
          if (!e.total) return;
          const pct = Math.round((e.loaded / e.total) * 100);
          onProgress?.(pct);
        },
      })
    );

    const secureUrl = res.data?.secure_url;
    if (!secureUrl) throw new Error("Cloudinary upload failed");

    const { data } = await api.patch<ApiResponse<{ user: AuthUser }>>("/users/me", { avatar: secureUrl });
    return normalizeUser(data.data.user);
  } catch (err) {
    const status = (err as { response?: { status?: number } })?.response?.status;
    if (status === 500 || status === 503) {
      return uploadAvatarViaServer(file, onProgress);
    }
    throw err;
  }
};
