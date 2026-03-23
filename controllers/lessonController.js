import Lesson from "../models/Lesson.js";
import Module from "../models/Module.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { sendResponse } from "../utils/apiResponse.js";
import { grantXP } from "../services/xpService.js";

export const createLesson = asyncHandler(async (req, res) => {
  const lesson = await Lesson.create(req.body);
  await Module.findByIdAndUpdate(lesson.module, { $addToSet: { lessons: lesson._id } });
  sendResponse(res, 201, "Lesson created", { lesson });
});

export const getLessons = asyncHandler(async (req, res) => {
  const filter = req.query.module ? { module: req.query.module } : {};
  const lessons = await Lesson.find(filter).sort({ order: 1, createdAt: 1 });
  sendResponse(res, 200, "Lessons fetched", { lessons });
});

export const getLessonById = asyncHandler(async (req, res) => {
  const lesson = await Lesson.findById(req.params.id);
  if (!lesson) throw new ApiError(404, "Lesson not found");
  sendResponse(res, 200, "Lesson fetched", { lesson });
});

export const updateLesson = asyncHandler(async (req, res) => {
  const lesson = await Lesson.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!lesson) throw new ApiError(404, "Lesson not found");
  sendResponse(res, 200, "Lesson updated", { lesson });
});

export const deleteLesson = asyncHandler(async (req, res) => {
  const lesson = await Lesson.findByIdAndDelete(req.params.id);
  if (!lesson) throw new ApiError(404, "Lesson not found");
  await Module.findByIdAndUpdate(lesson.module, { $pull: { lessons: lesson._id } });
  sendResponse(res, 200, "Lesson deleted");
});

export const completeLesson = asyncHandler(async (req, res) => {
  const lesson = await Lesson.findById(req.params.id);
  if (!lesson) throw new ApiError(404, "Lesson not found");

  const result = await grantXP({
    userId: req.user._id,
    amount: lesson.xpReward || 0,
    reason: `Completed lesson: ${lesson.title}`,
    sourceType: "lesson",
    sourceId: lesson._id,
  });

  sendResponse(res, 200, "Lesson completed and XP awarded", {
    xpAdded: lesson.xpReward,
    user: { xp: result.user.xp, level: result.user.level },
  });
});
