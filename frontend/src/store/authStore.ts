import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface AuthUser {
  id: string;
  fullName: string;
  email: string;
  role: "student" | "mentor" | "admin" | "parent";
  level?: number;
  xp?: number;
  isVerified?: boolean;
  avatar?: string;
}

interface AuthState {
  hydrated: boolean;
  user: AuthUser | null;
  accessToken: string | null;
  setHydrated: (hydrated: boolean) => void;
  setAuth: (user: AuthUser, accessToken: string) => void;
  setAccessToken: (accessToken: string) => void;
  setUser: (user: AuthUser) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      hydrated: false,
      user: null,
      accessToken: null,
      setHydrated: (hydrated) => set({ hydrated }),
      setAuth: (user, accessToken) => set({ user, accessToken }),
      setAccessToken: (accessToken) => set({ accessToken }),
      setUser: (user) => set({ user }),
      logout: () => set({ user: null, accessToken: null }),
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
