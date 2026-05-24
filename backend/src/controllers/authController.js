import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { sendResponse } from "../utils/apiResponse.js";
import { loginUser, logoutUser, refreshAccessToken, registerUser } from "../services/authService.js";

export const register = asyncHandler(async (req, res) => {
  const { fullName, email, password, role, gradeLevel } = req.body;

  if (!fullName || !email || !password) {
    throw new ApiError(400, "fullName, email, and password are required");
  }

  if (password.length < 6) {
    throw new ApiError(400, "Password must be at least 6 characters");
  }

  const user = await registerUser({ fullName, email, password, role, gradeLevel });
  sendResponse(res, 201, "User registered", {
    user: {
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      level: user.level,
      xp: user.xp,
    },
  });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    throw new ApiError(400, "email and password are required");
  }

  const { user, accessToken, refreshToken } = await loginUser({ email, password });

  sendResponse(res, 200, "Login successful", {
    accessToken,
    refreshToken,
    user: {
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      level: user.level,
      xp: user.xp,
    },
  });
});

export const refresh = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    throw new ApiError(400, "refreshToken is required");
  }

  const data = await refreshAccessToken(refreshToken);

  sendResponse(res, 200, "Token refreshed", {
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
  });
});

export const logout = asyncHandler(async (req, res) => {
  await logoutUser(req.user._id);
  sendResponse(res, 200, "Logged out successfully");
});

export const me = asyncHandler(async (req, res) => {
  sendResponse(res, 200, "Profile fetched", { user: req.user });
});
