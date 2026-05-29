import User from "../models/User.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { sendResponse } from "../utils/apiResponse.js";
import { getPagination } from "../utils/pagination.js";
import { sanitizeOptionalText } from "../utils/sanitize.js";
import { v2 as cloudinary } from "cloudinary";
import { logger } from "../lib/logger.js";
import { serializeAuthUser } from "../utils/serializeUser.js";

// Configure Cloudinary from environment (used for server-side uploads and signing)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Simple in-memory rate limiter per user for signature requests
const signatureRequestTimestamps = new Map();
const SIGNATURE_COOLDOWN_MS = 5 * 1000; // 5 seconds


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
      .select("-password -refreshTokenHash -refreshTokenExpiresAt")
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
  const user = await User.findById(req.params.id).select("-password -refreshTokenHash -refreshTokenExpiresAt");
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

export const updateMyProfile = asyncHandler(async (req, res) => {
  const allowedFields = [
    "fullName",
    "avatar",
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
    updates[field] = req.body[field];
  });

  const user = await User.findByIdAndUpdate(req.user._id, updates, {
    new: true,
    runValidators: true,
  }).select("-password -refreshTokenHash -refreshTokenExpiresAt");

  sendResponse(res, 200, "Profile updated", { user: serializeAuthUser(user) });
});

// Upload avatar to Cloudinary and update user avatar URL
export const updateAvatar = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, "No file uploaded");

  // Configure cloudinary via env variables
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  // Upload buffer
  const uploadResult = await new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "avatars", transformation: [{ width: 512, height: 512, crop: "limit" }, { quality: "auto" }] },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    stream.end(req.file.buffer);
  });

  const url = uploadResult && uploadResult.secure_url;
  const user = await User.findByIdAndUpdate(req.user._id, { avatar: url }, { new: true }).select("-password -refreshTokenHash -refreshTokenExpiresAt");
  sendResponse(res, 200, "Avatar updated", { user: serializeAuthUser(user) });
});

// Generate a Cloudinary signature for direct client uploads
export const getAvatarUploadSignature = asyncHandler(async (req, res) => {
  // Ensure Cloudinary is configured
  if (!process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET || !process.env.CLOUDINARY_CLOUD_NAME) {
    logger.error("Cloudinary configuration missing when requesting upload signature", { userId: req.user?._id });
    throw new ApiError(500, "Upload service not configured");
  }

  // Rate-limit per user
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
