import Lesson from "../models/Lesson.js";
import Module from "../models/Module.js";
import LessonProgress from "../models/LessonProgress.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { sendResponse } from "../utils/apiResponse.js";
import { grantXPWithOptions } from "../services/xpService.js";

export const createLesson = asyncHandler(async (req, res) => {
  const moduleDoc = await Module.findById(req.body.module);
  if (!moduleDoc) throw new ApiError(404, "Module not found");

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
  const existingLesson = await Lesson.findById(req.params.id);
  if (!existingLesson) throw new ApiError(404, "Lesson not found");

  if (req.body.module) {
    const targetModule = await Module.findById(req.body.module);
    if (!targetModule) throw new ApiError(404, "Module not found");
  }

  const lesson = await Lesson.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (req.body.module && String(existingLesson.module) !== String(lesson.module)) {
    await Promise.all([
      Module.findByIdAndUpdate(existingLesson.module, { $pull: { lessons: lesson._id } }),
      Module.findByIdAndUpdate(lesson.module, { $addToSet: { lessons: lesson._id } }),
    ]);
  }

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

  const existingProgress = await LessonProgress.findOne({
    student: req.user._id,
    lesson: lesson._id,
  });

  if (existingProgress) {
    return sendResponse(res, 200, "Lesson already completed", {
      xpAdded: 0,
      alreadyCompleted: true,
    });
  }

  const progress = await LessonProgress.create({
    student: req.user._id,
    lesson: lesson._id,
    xpAwarded: lesson.xpReward || 0,
  });

  const result = await grantXPWithOptions({
    userId: req.user._id,
    amount: lesson.xpReward || 0,
    reason: `Completed lesson: ${lesson.title}`,
    sourceType: "lesson",
    sourceId: lesson._id,
    enforceUniqueSource: true,
    allowExisting: true,
  });

  sendResponse(res, 200, "Lesson completed and XP awarded", {
    xpAdded: lesson.xpReward,
    progress,
    user: { xp: result.user.xp, level: result.user.level },
  });
});

export const getMyLessonProgress = asyncHandler(async (req, res) => {
  const progress = await LessonProgress.find({ student: req.user._id })
    .sort({ completedAt: -1 })
    .limit(200)
    .populate({
      path: "lesson",
      select: "title module xpReward order",
      populate: { path: "module", select: "title track", populate: { path: "track", select: "title" } },
    });

  sendResponse(res, 200, "Lesson progress fetched", { progress });
});

export const getMyLessonProgressSummary = asyncHandler(async (req, res) => {
  const [completedLessons, totalXpFromLessons] = await Promise.all([
    LessonProgress.countDocuments({ student: req.user._id }),
    LessonProgress.aggregate([
      { $match: { student: req.user._id } },
      { $group: { _id: null, total: { $sum: "$xpAwarded" } } },
    ]),
  ]);

  sendResponse(res, 200, "Lesson progress summary fetched", {
    completedLessons,
    totalXpFromLessons: totalXpFromLessons[0]?.total || 0,
  });
});
