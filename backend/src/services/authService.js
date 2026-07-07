import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import ApiError from "../utils/ApiError.js";
import { getEnv } from "../config/env.js";
import { createAssignedAvatar } from "./avatarService.js";
import { USER_STATUS, MENTOR_ACCOUNT_STATUS } from "../config/permissions.js";

export const PUBLIC_REGISTER_ROLES = ["student"];

export const sanitizeRegisterRole = (role) =>
  PUBLIC_REGISTER_ROLES.includes(role) ? role : "student";

const accessExpiry = () => getEnv().jwtExpiresIn;
const refreshExpiryDays = () => getEnv().jwtRefreshDays;

const hashToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

const signAccessToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, getEnv().jwtSecret, {
    expiresIn: accessExpiry(),
  });

const signRefreshToken = (user) =>
  jwt.sign(
    { id: user._id, type: "refresh", jti: crypto.randomBytes(16).toString("hex") },
    getEnv().jwtRefreshSecret,
    { expiresIn: `${refreshExpiryDays()}d` }
  );

export const registerUser = async ({
  fullName,
  email,
  password,
  role = "student",
  gradeLevel,
  city,
  learningInterests,
}) => {
  const safeRole = sanitizeRegisterRole(role);

  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    throw new ApiError(409, "Email already registered");
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const avatar = createAssignedAvatar({ role: safeRole, seed: email.toLowerCase() });
  const user = await User.create({
    fullName,
    email,
    password: hashedPassword,
    role: safeRole,
    status: USER_STATUS.ACTIVE,
    gradeLevel,
    city: city?.trim() || undefined,
    learningInterests: Array.isArray(learningInterests)
      ? learningInterests.map((item) => item.trim()).filter(Boolean)
      : undefined,
    avatar: avatar.avatarUrl,
    avatarUrl: avatar.avatarUrl,
    avatarType: avatar.avatarType,
    avatarSource: avatar.avatarSource,
    avatarPublicId: avatar.avatarPublicId,
  });

  return user;
};

export const loginUser = async ({ email, password, ip }) => {
  const user = await User.findOne({ email: email.toLowerCase() }).select(
    "+password +refreshTokenHash +refreshTokenExpiresAt +loginAttempts +lockUntil +mustChangePassword"
  );
  if (!user) {
    throw new ApiError(401, "Invalid credentials");
  }

  if (user.deletedAt) {
    throw new ApiError(401, "Account has been deleted");
  }

  if (user.status === USER_STATUS.SUSPENDED) {
    throw new ApiError(403, "Account is suspended. Please contact support.");
  }

  if (user.status === USER_STATUS.BANNED) {
    throw new ApiError(403, "Account has been permanently banned.");
  }

  if (user.mustChangePassword && user.credentialsExpiresAt && user.credentialsExpiresAt < new Date()) {
    throw new ApiError(403, "Your temporary credentials have expired. Please contact an administrator to resend credentials.");
  }

  if (user.mentorAccountStatus === MENTOR_ACCOUNT_STATUS.SUSPENDED) {
    throw new ApiError(403, "Your mentor account is suspended. Please contact support.");
  }

  if (user.mentorAccountStatus === MENTOR_ACCOUNT_STATUS.DISABLED) {
    throw new ApiError(403, "Your mentor account is disabled. Please contact support.");
  }

  if (user.lockUntil && user.lockUntil > new Date()) {
    const minutesLeft = Math.ceil((user.lockUntil.getTime() - Date.now()) / 60000);
    throw new ApiError(
      403,
      `Account is temporarily locked due to too many failed attempts. Try again in ${minutesLeft} minute${minutesLeft > 1 ? "s" : ""}.`
    );
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    user.loginAttempts = (user.loginAttempts ?? 0) + 1;
    if (user.loginAttempts >= 10) {
      user.lockUntil = new Date(Date.now() + 30 * 60 * 1000);
    }
    await user.save();
    throw new ApiError(401, "Invalid credentials");
  }

  return createAuthSession(user, ip);
};

export const createAuthSession = async (user, ip) => {
  user.loginAttempts = 0;
  user.lockUntil = undefined;

  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);

  user.refreshTokenHash = hashToken(refreshToken);
  user.refreshTokenExpiresAt = new Date(Date.now() + refreshExpiryDays() * 24 * 60 * 60 * 1000);
  user.lastLoginAt = new Date();
  user.lastLoginIp = ip;

  if (user.role === "mentor" && user.mentorAccountStatus === MENTOR_ACCOUNT_STATUS.INVITED) {
    user.mentorAccountStatus = MENTOR_ACCOUNT_STATUS.FIRST_LOGIN_PENDING;
  }

  await user.save();

  const authFlags = {
    requiresPasswordChange: Boolean(user.mustChangePassword),
    requiresTermsAcceptance: user.role === "mentor" && !user.termsAcceptedAt,
    requiresOnboarding: user.role === "mentor" && !user.onboardingCompletedAt,
  };

  return { user, accessToken, refreshToken, authFlags };
};

export const refreshAccessToken = async (refreshToken) => {
  let payload;

  try {
    payload = jwt.verify(refreshToken, getEnv().jwtRefreshSecret);
  } catch {
    throw new ApiError(401, "Invalid refresh token");
  }

  const user = await User.findById(payload.id).select("+refreshTokenHash +refreshTokenExpiresAt");
  if (!user || !user.refreshTokenHash || !user.refreshTokenExpiresAt) {
    throw new ApiError(401, "Refresh session not found");
  }

  if (user.refreshTokenExpiresAt < new Date()) {
    throw new ApiError(401, "Refresh token expired");
  }

  if (user.deletedAt) {
    throw new ApiError(401, "Account has been deleted");
  }

  if (user.status === USER_STATUS.SUSPENDED || user.status === USER_STATUS.BANNED) {
    throw new ApiError(403, "Account is suspended or banned");
  }

  const incomingHash = hashToken(refreshToken);
  if (incomingHash !== user.refreshTokenHash) {
    user.refreshTokenHash = undefined;
    user.refreshTokenExpiresAt = undefined;
    await user.save();
    throw new ApiError(401, "Refresh token reuse detected — please sign in again");
  }

  const newAccessToken = signAccessToken(user);
  const newRefreshToken = signRefreshToken(user);

  user.refreshTokenHash = hashToken(newRefreshToken);
  user.refreshTokenExpiresAt = new Date(Date.now() + refreshExpiryDays() * 24 * 60 * 60 * 1000);
  await user.save();

  return { accessToken: newAccessToken, refreshToken: newRefreshToken, user };
};

export const requestPasswordReset = async (email) => {
  const user = await User.findOne({ email: email.toLowerCase() }).select(
    "+passwordResetHash +passwordResetExpiresAt"
  );
  if (!user) {
    return { sent: true };
  }

  const resetToken = crypto.randomBytes(32).toString("hex");
  user.passwordResetHash = hashToken(resetToken);
  user.passwordResetExpiresAt = new Date(Date.now() + 60 * 60 * 1000);
  await user.save();

  return { sent: true, resetToken, userId: user._id };
};

export const resetPasswordWithToken = async ({ token, password }) => {
  const incomingHash = hashToken(token);
  const user = await User.findOne({
    passwordResetHash: incomingHash,
    passwordResetExpiresAt: { $gt: new Date() },
  }).select("+passwordResetHash +passwordResetExpiresAt +refreshTokenHash +refreshTokenExpiresAt");

  if (!user) {
    throw new ApiError(400, "Invalid or expired reset token");
  }

  user.password = await bcrypt.hash(password, 10);
  user.passwordResetHash = undefined;
  user.passwordResetExpiresAt = undefined;
  user.refreshTokenHash = undefined;
  user.refreshTokenExpiresAt = undefined;
  await user.save();
  return user;
};

export const changePassword = async ({ userId, currentPassword, newPassword }) => {
  const user = await User.findById(userId).select(
    "+password +refreshTokenHash +refreshTokenExpiresAt"
  );
  if (!user) throw new ApiError(404, "User not found");

  const matches = await bcrypt.compare(currentPassword, user.password);
  if (!matches) throw new ApiError(401, "Current password is incorrect");

  user.password = await bcrypt.hash(newPassword, 10);
  user.refreshTokenHash = undefined;
  user.refreshTokenExpiresAt = undefined;
  await user.save();
  return user;
};

export const logoutUser = async (userId) => {
  const user = await User.findById(userId).select("+refreshTokenHash +refreshTokenExpiresAt");
  if (!user) return;

  user.refreshTokenHash = undefined;
  user.refreshTokenExpiresAt = undefined;
  await user.save();
};

export const activateAccountWithToken = async ({ token, password }) => {
  const incomingHash = hashToken(token);
  const user = await User.findOne({
    activationTokenHash: incomingHash,
    activationTokenExpiresAt: { $gt: new Date() },
  }).select(
    "+activationTokenHash +activationTokenExpiresAt +password +refreshTokenHash +refreshTokenExpiresAt +mustChangePassword"
  );

  if (!user) {
    throw new ApiError(400, "Invalid or expired activation token");
  }

  user.password = await bcrypt.hash(password, 10);
  user.activationTokenHash = undefined;
  user.activationTokenExpiresAt = undefined;
  user.mustChangePassword = false;
  user.passwordChangedAt = new Date();
  user.credentialsExpiresAt = undefined;
  user.mentorAccountStatus = MENTOR_ACCOUNT_STATUS.ACTIVATED;
  if (user.onboardingSteps) {
    user.onboardingSteps.passwordChanged = true;
  }
  user.refreshTokenHash = undefined;
  user.refreshTokenExpiresAt = undefined;
  await user.save();
  return user;
};

export const firstLoginChangePassword = async ({ userId, currentPassword, newPassword }) => {
  const user = await User.findById(userId).select(
    "+password +mustChangePassword +refreshTokenHash +refreshTokenExpiresAt"
  );
  if (!user) throw new ApiError(404, "User not found");

  const matches = await bcrypt.compare(currentPassword, user.password);
  if (!matches) throw new ApiError(401, "Current password is incorrect");

  user.password = await bcrypt.hash(newPassword, 10);
  user.mustChangePassword = false;
  user.passwordChangedAt = new Date();
  user.credentialsExpiresAt = undefined;
  if (user.onboardingSteps) {
    user.onboardingSteps.passwordChanged = true;
  }
  if (user.mentorAccountStatus === MENTOR_ACCOUNT_STATUS.INVITED ||
      user.mentorAccountStatus === MENTOR_ACCOUNT_STATUS.FIRST_LOGIN_PENDING ||
      user.mentorAccountStatus === MENTOR_ACCOUNT_STATUS.PASSWORD_RESET_REQUIRED) {
    user.mentorAccountStatus = MENTOR_ACCOUNT_STATUS.ACTIVATED;
  }
  user.refreshTokenHash = undefined;
  user.refreshTokenExpiresAt = undefined;
  await user.save();
  return user;
};

export const acceptTerms = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, "User not found");
  user.termsAcceptedAt = new Date();
  if (user.onboardingSteps) {
    user.onboardingSteps.termsAccepted = true;
  }
  await user.save();
  return user;
};

export const getOnboardingStatus = (user) => {
  const steps = user.onboardingSteps ?? {};
  const profileCompleted = Boolean(
    user.bio && user.expertise?.length >= 2 && user.currentCompany
  );
  const photoUploaded = user.avatarType === "uploaded" || steps.photoUploaded;
  const availabilitySet = steps.availabilitySet;

  return {
    mustChangePassword: Boolean(user.mustChangePassword),
    termsAccepted: Boolean(user.termsAcceptedAt || steps.termsAccepted),
    profileCompleted,
    photoUploaded,
    availabilitySet,
    onboardingCompleted: Boolean(user.onboardingCompletedAt),
    mentorAccountStatus: user.mentorAccountStatus,
    steps: {
      passwordChanged: Boolean(steps.passwordChanged && !user.mustChangePassword),
      termsAccepted: Boolean(user.termsAcceptedAt || steps.termsAccepted),
      profileCompleted,
      photoUploaded,
      availabilitySet,
    },
  };
};

export const updateOnboardingStep = async (userId, step, value = true) => {
  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, "User not found");
  if (!user.onboardingSteps) {
    user.onboardingSteps = {};
  }
  user.onboardingSteps[step] = value;
  await user.save();
  return user;
};

export const completeOnboarding = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, "User not found");

  const status = getOnboardingStatus(user);
  if (status.mustChangePassword) {
    throw new ApiError(400, "Password change is required before completing onboarding");
  }
  if (!status.termsAccepted) {
    throw new ApiError(400, "Terms acceptance is required");
  }
  if (!status.profileCompleted) {
    throw new ApiError(400, "Profile completion is required");
  }
  if (!status.photoUploaded) {
    throw new ApiError(400, "Profile photo is required");
  }
  if (!status.availabilitySet) {
    throw new ApiError(400, "Teaching availability is required");
  }

  user.onboardingCompletedAt = new Date();
  user.mentorAccountStatus = MENTOR_ACCOUNT_STATUS.ACTIVE;
  user.onboardingSteps.profileCompleted = true;
  user.onboardingSteps.photoUploaded = true;
  user.onboardingSteps.availabilitySet = true;
  await user.save();
  return user;
};
