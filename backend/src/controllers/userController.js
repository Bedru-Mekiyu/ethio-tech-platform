import User from "../models/User.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { sendResponse } from "../utils/apiResponse.js";
import { getPagination } from "../utils/pagination.js";
import { sanitizeOptionalText } from "../utils/sanitize.js";
import { v2 as cloudinary } from "cloudinary";
import { logger } from "../lib/logger.js";
import { serializeAuthUser } from "../utils/serializeUser.js";
import {
  getCloudinaryPublicIdFromUrl,
  getSystemAvatarById,
  getSystemAvatarCatalog,
  getSystemAvatarCatalogForRole,
  isSystemAvatarUrl,
  pickAlternateSystemAvatar,
} from "../services/avatarService.js";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const signatureRequestTimestamps = new Map();
const SIGNATURE_COOLDOWN_MS = 5 * 1000;

const uploadBufferToCloudinary = async (buffer) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "avatars",
        resource_type: "image",
        transformation: [
          { width: 512, height: 512, crop: "fill", gravity: "face" },
          { quality: "auto", fetch_format: "auto" },
        ],
        overwrite: false,
        unique_filename: true,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    stream.end(buffer);
  });

const deleteCloudinaryAsset = async (publicId) => {
  if (!publicId) return;
  const result = await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
  if (result?.result === "not found") {
    return;
  }
  if (result?.result !== "ok") {
    throw new Error(`Could not delete avatar asset (${result?.result ?? "unknown"})`);
  }
};

const emitAvatarUpdate = (req, user) => {
  const io = req.app.get("io");
  if (!io) return;
  io.emit("user:avatar:updated", {
    userId: String(user._id),
    avatarUrl: user.avatarUrl ?? user.avatar,
    avatarType: user.avatarType,
    avatarSource: user.avatarSource,
    updatedAt: new Date().toISOString(),
  });
};

const finalizeAvatarChange = async ({ req, avatarData, previousUser, previousAvatarPublicId }) => {
  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      ...avatarData,
      avatar: avatarData.avatarUrl,
    },
    { new: true, runValidators: true }
  ).select("-password -refreshTokenHash -refreshTokenExpiresAt -avatarPublicId");

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (previousAvatarPublicId) {
    try {
      await deleteCloudinaryAsset(previousAvatarPublicId);
    } catch (error) {
      if (avatarData.avatarPublicId) {
        await deleteCloudinaryAsset(avatarData.avatarPublicId).catch(() => {});
      }
      await User.findByIdAndUpdate(previousUser._id, {
        avatar: previousUser.avatar,
        avatarUrl: previousUser.avatarUrl,
        avatarType: previousUser.avatarType,
        avatarSource: previousUser.avatarSource,
        avatarPublicId: previousUser.avatarPublicId,
      }).catch(() => {});
      logger.error("Avatar replacement cleanup failed", {
        userId: req.user._id,
        error: error instanceof Error ? error.message : String(error),
      });
      throw new ApiError(502, "Could not replace the previous avatar");
    }
  }

  emitAvatarUpdate(req, user);
  return user;
};

const resolveAvatarInput = (body, currentUser) => {
  const avatarUrl = body.avatarUrl ?? body.avatar;
  if (!avatarUrl) return {};

  const isSystem = isSystemAvatarUrl(avatarUrl);
  return {
    avatarUrl,
    avatar: avatarUrl,
    avatarType: body.avatarType ?? (isSystem ? "default" : "uploaded"),
    avatarSource: body.avatarSource ?? (isSystem ? "system" : "cloudinary"),
    avatarPublicId: isSystem
      ? null
      : body.avatarPublicId ?? currentUser?.avatarPublicId ?? getCloudinaryPublicIdFromUrl(currentUser?.avatarUrl ?? currentUser?.avatar),
  };
};

export const getUsers = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const { role, search } = req.query;

  const filter = {};
  if (role) filter.role = role;
  if (search) {
    filter.$or = [
      { fullName: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ];
  }

  const [items, total] = await Promise.all([
    User.find(filter)
      .select("-password -refreshTokenHash -refreshTokenExpiresAt -avatarPublicId")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    User.countDocuments(filter),
  ]);

  sendResponse(res, 200, "Users fetched", {
    items,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
});

export const getMe = asyncHandler(async (req, res) => {
  sendResponse(res, 200, "Profile fetched", { user: serializeAuthUser(req.user) });
});

export const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select("-password -refreshTokenHash -refreshTokenExpiresAt -avatarPublicId");
  if (!user) throw new ApiError(404, "User not found");

  const isSelf = String(req.user._id) === String(user._id);
  const isAdmin = req.user.role === "admin";
  const payload = user.toObject();
  if (!isSelf && !isAdmin) {
    delete payload.email;
    delete payload.phone;
  }

  sendResponse(res, 200, "User fetched", { user: payload });
});

export const getAvatarLibrary = asyncHandler(async (_req, res) => {
  sendResponse(res, 200, "Avatar library fetched", {
    avatars: getSystemAvatarCatalog(),
    grouped: {
      student: getSystemAvatarCatalogForRole("student"),
      mentor: getSystemAvatarCatalogForRole("mentor"),
    },
  });
});

export const updateMyProfile = asyncHandler(async (req, res) => {
  const allowedFields = [
    "fullName",
    "avatar",
    "avatarUrl",
    "avatarType",
    "avatarSource",
    "bio",
    "phone",
    "gradeLevel",
    "expertise",
    "currentCompany",
  ];

  const updates = {};
  allowedFields.forEach((field) => {
    if (req.body[field] === undefined) return;
    if (field === "bio") {
      updates.bio = sanitizeOptionalText(req.body.bio, 1000);
      return;
    }
    if (field === "fullName") {
      updates.fullName = sanitizeOptionalText(req.body.fullName, 120);
      return;
    }
    if (field === "avatar" || field === "avatarUrl" || field === "avatarType" || field === "avatarSource") {
      Object.assign(updates, resolveAvatarInput(req.body, req.user));
      return;
    }
    updates[field] = req.body[field];
  });

  const user = await User.findByIdAndUpdate(req.user._id, updates, {
    new: true,
    runValidators: true,
  }).select("-password -refreshTokenHash -refreshTokenExpiresAt -avatarPublicId");

  sendResponse(res, 200, "Profile updated", { user: serializeAuthUser(user) });
});

export const uploadMyAvatar = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, "No file uploaded");

  const currentUser = await User.findById(req.user._id).select("+avatarPublicId");
  if (!currentUser) throw new ApiError(404, "User not found");

  const previousAvatarPublicId =
    currentUser.avatarSource === "cloudinary"
      ? currentUser.avatarPublicId ?? getCloudinaryPublicIdFromUrl(currentUser.avatarUrl ?? currentUser.avatar)
      : null;

  const uploadResult = await uploadBufferToCloudinary(req.file.buffer);
  const avatarData = {
    avatarUrl: uploadResult.secure_url,
    avatarType: "uploaded",
    avatarSource: "cloudinary",
    avatarPublicId: uploadResult.public_id,
  };

  const user = await finalizeAvatarChange({
    req,
    avatarData,
    previousUser: currentUser,
    previousAvatarPublicId,
  });

  sendResponse(res, 200, "Avatar updated", { user: serializeAuthUser(user) });
});

export const selectSystemAvatar = asyncHandler(async (req, res) => {
  const avatar = getSystemAvatarById(req.params.avatarId);
  if (!avatar) throw new ApiError(404, "Avatar not found");

  const currentUser = await User.findById(req.user._id).select("+avatarPublicId");
  if (!currentUser) throw new ApiError(404, "User not found");

  const previousAvatarPublicId =
    currentUser.avatarSource === "cloudinary"
      ? currentUser.avatarPublicId ?? getCloudinaryPublicIdFromUrl(currentUser.avatarUrl ?? currentUser.avatar)
      : null;

  const user = await finalizeAvatarChange({
    req,
    avatarData: {
      avatarUrl: avatar.url,
      avatarType: "default",
      avatarSource: "system",
      avatarPublicId: null,
    },
    previousUser: currentUser,
    previousAvatarPublicId,
  });

  sendResponse(res, 200, "Default avatar selected", {
    user: serializeAuthUser(user),
    avatar,
  });
});

export const removeMyAvatar = asyncHandler(async (req, res) => {
  const currentUser = await User.findById(req.user._id).select("+avatarPublicId");
  if (!currentUser) throw new ApiError(404, "User not found");

  const previousAvatarPublicId =
    currentUser.avatarSource === "cloudinary"
      ? currentUser.avatarPublicId ?? getCloudinaryPublicIdFromUrl(currentUser.avatarUrl ?? currentUser.avatar)
      : null;

  const nextAvatar = pickAlternateSystemAvatar(currentUser.role, [], currentUser._id?.toString?.() ?? currentUser.email ?? currentUser.fullName);

  const user = await finalizeAvatarChange({
    req,
    avatarData: {
      avatarUrl: nextAvatar.url,
      avatarType: "default",
      avatarSource: "system",
      avatarPublicId: null,
    },
    previousUser: currentUser,
    previousAvatarPublicId,
  });

  sendResponse(res, 200, "Avatar reset", { user: serializeAuthUser(user), avatar: nextAvatar });
});

export const getAvatarUploadSignature = asyncHandler(async (req, res) => {
  if (!process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET || !process.env.CLOUDINARY_CLOUD_NAME) {
    logger.error("Cloudinary configuration missing when requesting upload signature", { userId: req.user?._id });
    throw new ApiError(500, "Upload service not configured");
  }

  const userId = String(req.user?._id ?? "anonymous");
  const last = signatureRequestTimestamps.get(userId) ?? 0;
  const now = Date.now();
  if (now - last < SIGNATURE_COOLDOWN_MS) {
    logger.warn("Signature request throttled", { userId, ip: req.ip });
    throw new ApiError(429, "Too many requests. Please wait before trying again.");
  }
  signatureRequestTimestamps.set(userId, now);

  const timestamp = Math.floor(now / 1000);
  const folder = "avatars";
  const paramsToSign = { timestamp, folder };
  const signature = cloudinary.utils.api_sign_request(paramsToSign, process.env.CLOUDINARY_API_SECRET);

  logger.info("Generated Cloudinary signature for avatar upload", { userId, ip: req.ip });

  sendResponse(res, 200, "Signature generated", {
    signature,
    timestamp,
    apiKey: process.env.CLOUDINARY_API_KEY,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    folder,
  });
});

export const enrollTrack = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $addToSet: { enrolledTracks: req.params.trackId } },
    { new: true }
  ).populate("enrolledTracks", "title category");

  sendResponse(res, 200, "Track enrollment updated", { user });
});
