/** Shared auth/profile payload for API responses */
export const serializeAuthUser = (user) => ({
  id: user._id?.toString?.() ?? user._id,
  fullName: user.fullName,
  email: user.email,
  role: user.role,
  level: user.level,
  xp: user.xp,
  isVerified: user.isVerified,
  avatar: user.avatar ?? undefined,
  bio: user.bio ?? undefined,
  phone: user.phone ?? undefined,
  gradeLevel: user.gradeLevel ?? undefined,
  expertise: user.expertise ?? undefined,
  currentCompany: user.currentCompany ?? undefined,
});
