import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import ApiError from "../utils/ApiError.js";

const accessExpiry = process.env.JWT_EXPIRES_IN || "1d";
const refreshExpiryDays = Number(process.env.JWT_REFRESH_DAYS || 14);

const hashToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

const signAccessToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET || "dev-secret", {
    expiresIn: accessExpiry,
  });

const signRefreshToken = (user) =>
  jwt.sign({ id: user._id, type: "refresh" }, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || "dev-secret", {
    expiresIn: `${refreshExpiryDays}d`,
  });

export const registerUser = async ({ fullName, email, password, role = "student", gradeLevel }) => {
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    throw new ApiError(409, "Email already registered");
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await User.create({
    fullName,
    email,
    password: hashedPassword,
    role,
    gradeLevel: role === "student" ? gradeLevel : undefined,
  });

  return user;
};

export const loginUser = async ({ email, password }) => {
  const user = await User.findOne({ email: email.toLowerCase() }).select("+refreshTokenHash +refreshTokenExpiresAt");
  if (!user) {
    throw new ApiError(401, "Invalid credentials");
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new ApiError(401, "Invalid credentials");
  }

  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);

  user.refreshTokenHash = hashToken(refreshToken);
  user.refreshTokenExpiresAt = new Date(Date.now() + refreshExpiryDays * 24 * 60 * 60 * 1000);
  await user.save();

  return { user, accessToken, refreshToken };
};

export const refreshAccessToken = async (refreshToken) => {
  let payload;

  try {
    payload = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || "dev-secret"
    );
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
    throw new ApiError(401, "Refresh token mismatch");
  }

  const newAccessToken = signAccessToken(user);
  const newRefreshToken = signRefreshToken(user);

  user.refreshTokenHash = hashToken(newRefreshToken);
  user.refreshTokenExpiresAt = new Date(Date.now() + refreshExpiryDays * 24 * 60 * 60 * 1000);
  await user.save();

  return { accessToken: newAccessToken, refreshToken: newRefreshToken, user };
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
