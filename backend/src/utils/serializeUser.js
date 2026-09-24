import { createAssignedAvatar, isSystemAvatarUrl } from "../services/avatarService.js";

const isValidAvatarUrl = (url) => {
  if (!url || typeof url !== "string") return false;
  if (url.startsWith("http://") || url.startsWith("https://")) return true;
  return /^\/avatars\/(student|mentor)-0[1-4]\.svg$/.test(url);
};

export const serializeAuthUser = (user) => {
  const rawAvatar = user.avatarUrl ?? user.avatar;
  const safeAvatar = isValidAvatarUrl(rawAvatar)
    ? rawAvatar
    : createAssignedAvatar({ role: user.role, seed: user._id?.toString?.() ?? user.email ?? user.fullName }).avatarUrl;

  return {
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
    mentorAccountStatus: user.mentorAccountStatus ?? undefined,
    mustChangePassword: Boolean(user.mustChangePassword),
    onboardingCompleted: Boolean(user.onboardingCompletedAt),
    onboardingSteps: user.onboardingSteps ?? undefined,
    termsAcceptedAt: user.termsAcceptedAt ?? undefined,
    mentorScore: user.mentorScore ?? 0,
    totalSessions: user.totalSessions ?? 0,
    avatar: safeAvatar,
    avatarUrl: safeAvatar,
    avatarType:
      user.avatarType ??
      (safeAvatar ? (isSystemAvatarUrl(safeAvatar) ? "default" : "uploaded") : "default"),
    avatarSource:
      user.avatarSource ??
      (safeAvatar ? (isSystemAvatarUrl(safeAvatar) ? "system" : "cloudinary") : "system"),
    bio: user.bio ?? undefined,
    phone: user.phone ?? undefined,
    city: user.city ?? undefined,
    learningInterests: user.learningInterests ?? undefined,
    gradeLevel: user.gradeLevel ?? undefined,
    expertise: user.expertise ?? undefined,
    currentCompany: user.currentCompany ?? undefined,
    lastLoginAt: user.lastLoginAt ?? undefined,
  };
};
