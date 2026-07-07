import { api, type ApiResponse } from "./api";
import type { AuthUser, AuthFlags } from "@/store/authStore";

export interface OnboardingStatus {
  mustChangePassword: boolean;
  termsAccepted: boolean;
  profileCompleted: boolean;
  photoUploaded: boolean;
  availabilitySet: boolean;
  onboardingCompleted: boolean;
  mentorAccountStatus?: string;
  steps: {
    passwordChanged: boolean;
    termsAccepted: boolean;
    profileCompleted: boolean;
    photoUploaded: boolean;
    availabilitySet: boolean;
  };
}

export async function login(email: string, password: string) {
  const { data } = await api.post<
    ApiResponse<{ accessToken: string; user: AuthUser; authFlags?: AuthFlags }>
  >("/auth/login", { email, password });
  return data.data;
}

export async function register(payload: {
  fullName: string;
  email: string;
  password: string;
  gradeLevel?: number;
  city?: string;
  learningInterests?: string[];
}) {
  const { data } = await api.post<ApiResponse<{ user: AuthUser }>>("/auth/register", payload);
  return data.data;
}

export async function fetchMe() {
  const { data } = await api.get<
    ApiResponse<{ user: AuthUser; authFlags?: AuthFlags; onboarding?: OnboardingStatus }>
  >("/auth/me");
  return data.data;
}

export async function logoutApi() {
  await api.post("/auth/logout");
}

export async function forgotPassword(email: string) {
  const { data } = await api.post<
    ApiResponse<{ sent: boolean; message?: string; devResetToken?: string; devResetUrl?: string }>
  >("/auth/forgot-password", { email });
  return data.data;
}

export async function resetPassword(token: string, password: string) {
  const { data } = await api.post<ApiResponse<unknown>>("/auth/reset-password", { token, password });
  return data.data;
}

export async function activateAccount(token: string, password: string) {
  const { data } = await api.post<
    ApiResponse<{ accessToken: string; user: AuthUser; authFlags?: AuthFlags }>
  >("/auth/activate", { token, password });
  return data.data;
}

export async function firstLoginChangePassword(currentPassword: string, newPassword: string) {
  const { data } = await api.patch<
    ApiResponse<{ user: AuthUser; onboarding: OnboardingStatus }>
  >("/auth/first-login/change-password", { currentPassword, newPassword });
  return data.data;
}

export async function acceptTerms() {
  const { data } = await api.post<
    ApiResponse<{ user: AuthUser; onboarding: OnboardingStatus }>
  >("/auth/accept-terms");
  return data.data;
}

export async function fetchOnboardingStatus() {
  const { data } = await api.get<ApiResponse<{ onboarding: OnboardingStatus }>>(
    "/auth/onboarding-status"
  );
  return data.data.onboarding;
}

export async function completeOnboarding() {
  const { data } = await api.post<
    ApiResponse<{ user: AuthUser; onboarding: OnboardingStatus }>
  >("/auth/onboarding/complete");
  return data.data;
}

export async function updateOnboardingStep(
  step: "photoUploaded" | "profileCompleted" | "availabilitySet"
) {
  const { data } = await api.post<ApiResponse<{ onboarding: OnboardingStatus }>>(
    "/auth/onboarding/step",
    { step }
  );
  return data.data.onboarding;
}

export async function changePassword(currentPassword: string, newPassword: string) {
  const { data } = await api.patch<ApiResponse<unknown>>("/auth/password", {
    currentPassword,
    newPassword,
  });
  return data.data;
}
