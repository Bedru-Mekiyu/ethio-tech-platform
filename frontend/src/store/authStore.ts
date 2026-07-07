import { create } from "zustand";
import { persist } from "zustand/middleware";

export type UserRole = "super_admin" | "admin" | "moderator" | "reviewer" | "support" | "mentor" | "student" | "parent";

export type UserStatus = "pending" | "active" | "inactive" | "suspended" | "banned" | "rejected" | "deleted";

export interface AuthUser {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  status?: UserStatus;
  level?: number;
  xp?: number;
  credits?: number;
  isVerified?: boolean;
  mentorStatus?: "pending" | "approved" | "rejected" | "changes_requested" | "archived";
  mentorAccountStatus?: string;
  mustChangePassword?: boolean;
  onboardingCompleted?: boolean;
  onboardingSteps?: {
    passwordChanged?: boolean;
    termsAccepted?: boolean;
    profileCompleted?: boolean;
    photoUploaded?: boolean;
    availabilitySet?: boolean;
  };
  termsAcceptedAt?: string;
  mentorScore?: number;
  totalSessions?: number;
  avatar?: string;
  avatarUrl?: string;
  avatarType?: "uploaded" | "default";
  avatarSource?: "cloudinary" | "system";
  bio?: string;
  phone?: string;
  city?: string;
  learningInterests?: string[];
  gradeLevel?: number;
  expertise?: string[];
  currentCompany?: string;
  lastLoginAt?: string;
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

const roleDashboardMap: Record<UserRole, string> = {
  super_admin: "/admin",
  admin: "/admin",
  moderator: "/admin",
  reviewer: "/admin",
  support: "/admin",
  mentor: "/mentor",
  student: "/app/dashboard",
  parent: "/parent",
};

export function getDashboardPath(role: UserRole): string {
  return roleDashboardMap[role] || "/app/dashboard";
}

export interface AuthFlags {
  requiresPasswordChange?: boolean;
  requiresTermsAcceptance?: boolean;
  requiresOnboarding?: boolean;
}

export function getPostLoginPath(role: UserRole, authFlags?: AuthFlags): string {
  if (
    role === "mentor" &&
    (authFlags?.requiresPasswordChange ||
      authFlags?.requiresTermsAcceptance ||
      authFlags?.requiresOnboarding)
  ) {
    return "/mentor/onboarding";
  }
  return getDashboardPath(role);
}

const roleSettingsMap: Record<UserRole, string> = {
  super_admin: "/admin/settings",
  admin: "/admin/settings",
  moderator: "/admin/settings",
  reviewer: "/admin/settings",
  support: "/admin/settings",
  mentor: "/mentor/settings",
  student: "/app/settings",
  parent: "/parent/settings",
};

export function getSettingsPath(role: UserRole): string {
  return roleSettingsMap[role] || "/app/settings";
}
