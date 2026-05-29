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
} from "../services/authService.js";
import { serializeAuthUser } from "../utils/serializeUser.js";

export const register = asyncHandler(async (req, res) => {
  const { fullName, email, password, role, gradeLevel } = req.body;

  if (!fullName || !email || !password) {
    throw new ApiError(400, "fullName, email, and password are required");
  }

  if (password.length < 8) {
    throw new ApiError(400, "Password must be at least 8 characters");
  }

  const user = await registerUser({ fullName, email, password, role, gradeLevel });
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
    sameSite: isProd ? "strict" : "lax",
    maxAge: (getEnv().jwtRefreshDays || 14) * 24 * 60 * 60 * 1000,
  };
};

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    throw new ApiError(400, "email and password are required");
  }

  const { user, accessToken, refreshToken } = await loginUser({ email, password });
  await logAuditEvent({
    actor: user._id,
    action: "login",
    resource: "auth",
    ip: req.ip,
  });

  res.cookie("refreshToken", refreshToken, getCookieOptions());

  sendResponse(res, 200, "Login successful", {
    accessToken,
    user: serializeAuthUser(user),
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

  const { maxAge, ...clearOptions } = getCookieOptions();
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
  sendResponse(res, 200, "Password changed successfully");
});

export const me = asyncHandler(async (req, res) => {
  sendResponse(res, 200, "Profile fetched", { user: serializeAuthUser(req.user) });
});
