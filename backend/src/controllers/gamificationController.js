import asyncHandler from "../utils/asyncHandler.js";
import { sendResponse } from "../utils/apiResponse.js";
import {
  awardEligibleBadges,
  getTodayChallenge,
  recordDailyActivity,
} from "../services/gamificationService.js";
import UserStreak from "../models/UserStreak.js";
import DailyChallenge from "../models/DailyChallenge.js";
export const getMyStreak = asyncHandler(async (req, res) => {
  const streak = await UserStreak.findOne({ user: req.user._id });
  sendResponse(res, 200, "Streak fetched", { streak });
});

export const pingDailyActivity = asyncHandler(async (req, res) => {
  const streak = await recordDailyActivity(req.user._id);
  const badges = await awardEligibleBadges(req.user._id);
  sendResponse(res, 200, "Daily activity recorded", { streak, newBadges: badges });
});

export const getDailyChallenge = asyncHandler(async (req, res) => {
  const challenge = await getTodayChallenge();
  sendResponse(res, 200, "Daily challenge", { challenge });
});

export const createDailyChallenge = asyncHandler(async (req, res) => {
  const challenge = await DailyChallenge.create(req.body);
  sendResponse(res, 201, "Daily challenge created", { challenge });
});
