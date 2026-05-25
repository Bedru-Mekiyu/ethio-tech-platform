import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import ApiError from "../utils/ApiError.js";
import { getEnv } from "../config/env.js";

export const PUBLIC_REGISTER_ROLES = ["student", "mentor"];

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

export const registerUser = async ({ fullName, email, password, role = "student", gradeLevel }) => {
  const safeRole = sanitizeRegisterRole(role);

  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    throw new ApiError(409, "Email already registered");
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await User.create({
    fullName,
    email,
    password: hashedPassword,
    role: safeRole,
    gradeLevel: safeRole === "student" ? gradeLevel : undefined,
  });

  return user;
};

export const loginUser = async ({ email, password }) => {
  const user = await User.findOne({ email: email.toLowerCase() }).select(
    "+refreshTokenHash +refreshTokenExpiresAt +loginAttempts +lockUntil"
  );
  if (!user) {
    throw new ApiError(401, "Invalid credentials");
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
      user.lockUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes lockout
    }
    await user.save();
    throw new ApiError(401, "Invalid credentials");
  }

  user.loginAttempts = 0;
  user.lockUntil = undefined;

  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);

  user.refreshTokenHash = hashToken(refreshToken);
  user.refreshTokenExpiresAt = new Date(Date.now() + refreshExpiryDays() * 24 * 60 * 60 * 1000);
  await user.save();

  return { user, accessToken, refreshToken };
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
  if (!user) {
    return;
  }

  user.refreshTokenHash = undefined;
  user.refreshTokenExpiresAt = undefined;
  await user.save();
};
