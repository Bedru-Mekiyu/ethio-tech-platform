import User from "../models/User.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { sendResponse } from "../utils/apiResponse.js";
import { getPagination } from "../utils/pagination.js";
import { sanitizeOptionalText } from "../utils/sanitize.js";
import { v2 as cloudinary } from "cloudinary";

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

  sendResponse(res, 200, "Profile updated", { user });
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
  sendResponse(res, 200, "Avatar updated", { user });
});

export const enrollTrack = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $addToSet: { enrolledTracks: req.params.trackId } },
    { new: true }
  ).populate("enrolledTracks", "title category");

  sendResponse(res, 200, "Track enrollment updated", { user });
});
