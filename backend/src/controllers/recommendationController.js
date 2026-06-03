import asyncHandler from "../utils/asyncHandler.js";
import { sendResponse } from "../utils/apiResponse.js";
import { getRecommendedLessons, getRecommendedTracks, getSkillGapAnalysis, getLearningGoals } from "../services/recommendationService.js";

export const getRecommendedLessonsData = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 5;
  const lessons = await getRecommendedLessons(req.user._id, limit);
  sendResponse(res, 200, "Recommended lessons", { lessons });
});

export const getRecommendedTracksData = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 3;
  const tracks = await getRecommendedTracks(req.user._id, limit);
  sendResponse(res, 200, "Recommended tracks", { tracks });
});

export const getSkillGapData = asyncHandler(async (req, res) => {
  const analysis = await getSkillGapAnalysis(req.user._id);
  sendResponse(res, 200, "Skill gap analysis", analysis);
});

export const getLearningGoalsData = asyncHandler(async (req, res) => {
  const goals = await getLearningGoals(req.user._id);
  sendResponse(res, 200, "Learning goals", goals);
});
