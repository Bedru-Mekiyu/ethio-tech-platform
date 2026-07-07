import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { sendResponse } from "../utils/apiResponse.js";
import { getEnv } from "../config/env.js";
import { logAuditEvent } from "../middlewares/auditLog.js";
import {
  changePassword,
  loginUser,
  logoutUser,
  refreshAccessToken,
  registerUser,
  requestPasswordReset,
  resetPasswordWithToken,
  activateAccountWithToken,
  firstLoginChangePassword,
  acceptTerms,
  getOnboardingStatus,
  completeOnboarding,
  updateOnboardingStep,
  createAuthSession,
} from "../services/authService.js";
import { notifyProfileIncomplete } from "../services/notificationService.js";
import { serializeAuthUser } from "../utils/serializeUser.js";
import { notifyUser } from "../services/notificationService.js";

export const register = asyncHandler(async (req, res) => {
  const { fullName, email, password, gradeLevel, city, learningInterests } = req.body;

  if (!fullName || !email || !password) {
    throw new ApiError(400, "fullName, email, and password are required");
  }

  if (password.length < 8) {
    throw new ApiError(400, "Password must be at least 8 characters");
  }

  const user = await registerUser({
    fullName,
    email,
    password,
    role: "student",
    gradeLevel,
    city,
    learningInterests,
  });
  await logAuditEvent({
    actor: user._id,
    action: "register",
    resource: "auth",
    metadata: { email: user.email, role: user.role },
    ip: req.ip,
  });
  sendResponse(res, 201, "User registered", {
    user: serializeAuthUser(user),
  });
});

const getCookieOptions = () => {
  const isProd = getEnv().isProduction;
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    maxAge: (getEnv().jwtRefreshDays || 14) * 24 * 60 * 60 * 1000,
  };
};

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    throw new ApiError(400, "email and password are required");
  }

  const { user, accessToken, refreshToken, authFlags } = await loginUser({ email, password, ip: req.ip });
  await logAuditEvent({
    actor: user._id,
    action: "login",
    resource: "auth",
    ip: req.ip,
  });

  if (user.role === "mentor" && authFlags.requiresOnboarding) {
    await notifyProfileIncomplete({ userId: user._id }).catch(() => undefined);
  }

  res.cookie("refreshToken", refreshToken, getCookieOptions());

  sendResponse(res, 200, "Login successful", {
    accessToken,
    user: serializeAuthUser(user),
    authFlags,
  });
});

export const refresh = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies?.refreshToken;
  if (!refreshToken) {
    throw new ApiError(400, "refreshToken is required");
  }

  const data = await refreshAccessToken(refreshToken);

  res.cookie("refreshToken", data.refreshToken, getCookieOptions());

  sendResponse(res, 200, "Token refreshed", {
    accessToken: data.accessToken,
  });
});

export const logout = asyncHandler(async (req, res) => {
  await logoutUser(req.user._id);
  await logAuditEvent({
    actor: req.user._id,
    action: "logout",
    resource: "auth",
    ip: req.ip,
  });

  const clearOptions = { ...getCookieOptions() };
  delete clearOptions.maxAge;
  res.clearCookie("refreshToken", clearOptions);

  sendResponse(res, 200, "Logged out successfully");
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const result = await requestPasswordReset(email);
  const payload = { sent: true, message: "If that email exists, reset instructions were sent." };
  if (getEnv().nodeEnv !== "production" && result.resetToken) {
    payload.devResetToken = result.resetToken;
    payload.devResetUrl = `/auth/reset-password?token=${result.resetToken}`;
  }
  sendResponse(res, 200, "Password reset requested", payload);
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;
  const user = await resetPasswordWithToken({ token, password });
  await logAuditEvent({
    actor: user._id,
    action: "password_reset",
    resource: "auth",
    ip: req.ip,
  });
  sendResponse(res, 200, "Password updated successfully");
});

export const updatePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  await changePassword({
    userId: req.user._id,
    currentPassword,
    newPassword,
  });
  await logAuditEvent({
    actor: req.user._id,
    action: "password_change",
    resource: "auth",
    ip: req.ip,
  });

  await notifyUser({
    recipientId: req.user._id,
    type: "system",
    message: "Your password was changed successfully. If you did not make this change, contact support immediately.",
    link: "/app/settings",
    createdBy: req.user._id,
  });

  sendResponse(res, 200, "Password changed successfully");
});

export const me = asyncHandler(async (req, res) => {
  sendResponse(res, 200, "Profile fetched", {
    user: serializeAuthUser(req.user),
    authFlags: {
      requiresPasswordChange: Boolean(req.user.mustChangePassword),
      requiresTermsAcceptance: req.user.role === "mentor" && !req.user.termsAcceptedAt,
      requiresOnboarding: req.user.role === "mentor" && !req.user.onboardingCompletedAt,
    },
    onboarding: getOnboardingStatus(req.user),
  });
});

export const activate = asyncHandler(async (req, res) => {
  const { token, password } = req.body;
  const user = await activateAccountWithToken({ token, password });
  await logAuditEvent({
    actor: user._id,
    action: "mentor.activated",
    resource: "auth",
    ip: req.ip,
  });

  const { accessToken, refreshToken, authFlags } = await createAuthSession(user, req.ip);
  res.cookie("refreshToken", refreshToken, getCookieOptions());

  sendResponse(res, 200, "Account activated successfully", {
    accessToken,
    user: serializeAuthUser(user),
    authFlags,
  });
});

export const firstLoginPassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await firstLoginChangePassword({
    userId: req.user._id,
    currentPassword,
    newPassword,
  });
  await logAuditEvent({
    actor: user._id,
    action: "mentor.password_changed",
    resource: "auth",
    ip: req.ip,
  });
  sendResponse(res, 200, "Password updated", {
    user: serializeAuthUser(user),
    onboarding: getOnboardingStatus(user),
  });
});

export const acceptTermsHandler = asyncHandler(async (req, res) => {
  const user = await acceptTerms(req.user._id);
  sendResponse(res, 200, "Terms accepted", {
    user: serializeAuthUser(user),
    onboarding: getOnboardingStatus(user),
  });
});

export const onboardingStatus = asyncHandler(async (req, res) => {
  sendResponse(res, 200, "Onboarding status", {
    onboarding: getOnboardingStatus(req.user),
  });
});

export const completeOnboardingHandler = asyncHandler(async (req, res) => {
  const user = await completeOnboarding(req.user._id);
  await logAuditEvent({
    actor: user._id,
    action: "mentor.onboarding_completed",
    resource: "auth",
    ip: req.ip,
  });
  sendResponse(res, 200, "Onboarding completed", {
    user: serializeAuthUser(user),
    onboarding: getOnboardingStatus(user),
  });
});

export const updateOnboardingStepHandler = asyncHandler(async (req, res) => {
  const { step } = req.body;
  const user = await updateOnboardingStep(req.user._id, step, true);
  sendResponse(res, 200, "Onboarding step updated", {
    onboarding: getOnboardingStatus(user),
  });
});
