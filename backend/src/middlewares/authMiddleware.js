import jwt from "jsonwebtoken";
import User from "../models/User.js";
import ApiError from "../utils/ApiError.js";
import { getEnv } from "../config/env.js";
import { ROLE_PERMISSIONS, ROLE_HIERARCHY } from "../config/permissions.js";

export const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(new ApiError(401, "Not authorized, token missing"));
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, getEnv().jwtSecret);
    const user = await User.findById(decoded.id).select("-password +mustChangePassword");

    if (!user) {
      return next(new ApiError(401, "User no longer exists"));
    }

    if (user.deletedAt) {
      return next(new ApiError(401, "Account has been deleted"));
    }

    if (user.status === "suspended" || user.status === "banned") {
      return next(new ApiError(403, "Account is currently suspended or banned"));
    }

    req.user = user;
    next();
  } catch (_error) {
    next(new ApiError(401, "Invalid or expired token"));
  }
};

export const optionalProtect = async (req, _res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next();
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, getEnv().jwtSecret);
    const user = await User.findById(decoded.id).select("-password");
    if (user && !user.deletedAt && user.status !== "suspended" && user.status !== "banned") {
      req.user = user;
    }
  } catch {
    // ignore invalid optional token
  }

  next();
};

export const authorize = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return next(new ApiError(403, "Forbidden: insufficient role permissions"));
  }
  next();
};

export const requirePermission = (...permissions) => (req, res, next) => {
  if (!req.user) {
    return next(new ApiError(401, "Not authorized"));
  }

  const userPermissions = ROLE_PERMISSIONS[req.user.role] || [];
  const hasAllPermissions = permissions.every((p) => userPermissions.includes(p));

  if (!hasAllPermissions) {
    return next(new ApiError(403, "Forbidden: insufficient permissions"));
  }
  next();
};

export const requireAnyPermission = (...permissions) => (req, res, next) => {
  if (!req.user) {
    return next(new ApiError(401, "Not authorized"));
  }

  const userPermissions = ROLE_PERMISSIONS[req.user.role] || [];
  const hasAnyPermission = permissions.some((p) => userPermissions.includes(p));

  if (!hasAnyPermission) {
    return next(new ApiError(403, "Forbidden: insufficient permissions"));
  }
  next();
};

export const requireVerifiedMentor = (req, res, next) => {
  if (req.user?.role === "mentor" && !req.user.isVerified) {
    return next(new ApiError(403, "Mentor account must be verified before using mentor tools"));
  }
  next();
};

export const requireMentorOnboardingComplete = (req, res, next) => {
  if (req.user?.role !== "mentor") return next();
  if (req.user.mustChangePassword) {
    return next(new ApiError(403, "Password change required before accessing mentor tools"));
  }
  if (!req.user.onboardingCompletedAt) {
    return next(new ApiError(403, "Please complete mentor onboarding before accessing mentor tools"));
  }
  if (req.user.mentorAccountStatus === "suspended" || req.user.mentorAccountStatus === "disabled") {
    return next(new ApiError(403, "Mentor account is not active"));
  }
  next();
};

export const requireActiveMentorAccount = (req, res, next) => {
  if (req.user?.role !== "mentor") return next();
  const inactive = ["suspended", "disabled", "archived", "rejected"];
  if (inactive.includes(req.user.mentorAccountStatus)) {
    return next(new ApiError(403, "Mentor account is not active"));
  }
  next();
};

export const requireRoleLevel = (minimumRole) => (req, res, next) => {
  if (!req.user) {
    return next(new ApiError(401, "Not authorized"));
  }

  const userLevel = ROLE_HIERARCHY[req.user.role] || 0;
  const requiredLevel = ROLE_HIERARCHY[minimumRole] || 0;

  if (userLevel < requiredLevel) {
    return next(new ApiError(403, "Forbidden: insufficient role level"));
  }
  next();
};
