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
