import { createAssignedAvatar, isSystemAvatarUrl } from "../services/avatarService.js";

export const serializeAuthUser = (user) => ({
  id: user._id?.toString?.() ?? user._id,
  fullName: user.fullName,
  email: user.email,
  role: user.role,
  status: user.status,
  level: user.level,
  xp: user.xp,
  credits: user.credits,
  isVerified: user.isVerified,
  mentorStatus:
    user.mentorStatus ??
    (user.role === "mentor" ? (user.isVerified ? "approved" : "pending") : undefined),
  mentorScore: user.mentorScore ?? 0,
  totalSessions: user.totalSessions ?? 0,
  avatar: user.avatarUrl ?? user.avatar ?? createAssignedAvatar({ role: user.role, seed: user._id?.toString?.() ?? user.email ?? user.fullName }).avatarUrl,
  avatarUrl: user.avatarUrl ?? user.avatar ?? createAssignedAvatar({ role: user.role, seed: user._id?.toString?.() ?? user.email ?? user.fullName }).avatarUrl,
  avatarType:
    user.avatarType ??
    (user.avatarUrl || user.avatar ? (isSystemAvatarUrl(user.avatarUrl ?? user.avatar) ? "default" : "uploaded") : "default"),
  avatarSource:
    user.avatarSource ??
    (user.avatarUrl || user.avatar ? (isSystemAvatarUrl(user.avatarUrl ?? user.avatar) ? "system" : "cloudinary") : "system"),
  bio: user.bio ?? undefined,
  phone: user.phone ?? undefined,
  city: user.city ?? undefined,
  learningInterests: user.learningInterests ?? undefined,
  gradeLevel: user.gradeLevel ?? undefined,
  expertise: user.expertise ?? undefined,
  currentCompany: user.currentCompany ?? undefined,
  lastLoginAt: user.lastLoginAt ?? undefined,
});
