import Track from "../models/Track.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { sendResponse } from "../utils/apiResponse.js";
import { getPagination } from "../utils/pagination.js";

export const createTrack = asyncHandler(async (req, res) => {
  const track = await Track.create(req.body);
  sendResponse(res, 201, "Track created", { track });
});

export const getTracks = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const { category, isActive, search } = req.query;

  const filter = {};
  if (category) filter.category = category;
  if (isActive !== undefined) filter.isActive = isActive === "true";
  if (search) filter.title = { $regex: search, $options: "i" };

  const [items, total] = await Promise.all([
    Track.find(filter).populate("modules", "title order").sort({ createdAt: -1 }).skip(skip).limit(limit),
    Track.countDocuments(filter),
  ]);

  sendResponse(res, 200, "Tracks fetched", {
    tracks: items,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
});

export const getTrackById = asyncHandler(async (req, res) => {
  const track = await Track.findById(req.params.id).populate({
    path: "modules",
    populate: { path: "lessons", select: "title order xpReward durationMinutes" },
  });

  if (!track) throw new ApiError(404, "Track not found");
  sendResponse(res, 200, "Track fetched", { track });
});

export const updateTrack = asyncHandler(async (req, res) => {
  const track = await Track.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!track) throw new ApiError(404, "Track not found");
  sendResponse(res, 200, "Track updated", { track });
});

export const deleteTrack = asyncHandler(async (req, res) => {
  const track = await Track.findByIdAndDelete(req.params.id);
  if (!track) throw new ApiError(404, "Track not found");
  sendResponse(res, 200, "Track deleted");
});
