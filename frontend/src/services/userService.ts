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

import { compressImage } from "@/lib/image";

export const uploadAvatar = async (file: File, onProgress?: (percent: number) => void) => {
  // Compress image for mobile and low-bandwidth users
  const compressed = await compressImage(file, 512, 0.8);

  // Request signature from backend
  const { data: signData } = await api.get<ApiResponse<{ signature: string; timestamp: number; apiKey: string; cloudName: string; folder: string }>>("/users/me/avatar/sign");
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
      onUploadProgress: (e: any) => {
        if (!e.total) return;
        const pct = Math.round((e.loaded / e.total) * 100);
        onProgress?.(pct);
      },
    })
  );

  const secureUrl = res.data?.secure_url;
  if (!secureUrl) throw new Error("Cloudinary upload failed");

  // Update backend profile with the secure URL
  const { data } = await api.patch<ApiResponse<{ user: AuthUser }>>("/users/me", { avatar: secureUrl });
  return data.data.user;
};
