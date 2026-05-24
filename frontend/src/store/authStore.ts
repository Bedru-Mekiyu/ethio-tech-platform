import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface AuthUser {
  id: string;
  fullName: string;
  email: string;
  role: "student" | "mentor" | "admin" | "parent";
  level?: number;
  xp?: number;
}

interface AuthState {
  hydrated: boolean;
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  setHydrated: (hydrated: boolean) => void;
  setAuth: (user: AuthUser, accessToken: string, refreshToken: string) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  setUser: (user: AuthUser) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      hydrated: false,
      user: null,
      accessToken: null,
      refreshToken: null,
      setHydrated: (hydrated) => set({ hydrated }),
      setAuth: (user, accessToken, refreshToken) =>
        set({ user, accessToken, refreshToken }),
      setTokens: (accessToken, refreshToken) => set({ accessToken, refreshToken }),
      setUser: (user) => set({ user }),
      logout: () => set({ user: null, accessToken: null, refreshToken: null }),
    }),
    {
      name: "ethiotech-auth",
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    }
  )
);

export function getDashboardPath(role: AuthUser["role"]): string {
  switch (role) {
    case "mentor":
      return "/mentor";
    case "admin":
      return "/admin";
    case "parent":
      return "/parent";
    default:
      return "/app/dashboard";
  }
}

export function getSettingsPath(role: AuthUser["role"]): string {
  switch (role) {
    case "mentor":
      return "/mentor/settings";
    case "admin":
      return "/admin/settings";
    case "parent":
      return "/parent/settings";
    default:
      return "/app/settings";
  }
}
