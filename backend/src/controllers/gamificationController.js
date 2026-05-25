import asyncHandler from "../utils/asyncHandler.js";
import { sendResponse } from "../utils/apiResponse.js";
import ApiError from "../utils/ApiError.js";
import DailyChallengeCompletion from "../models/DailyChallengeCompletion.js";
import {
  awardEligibleBadges,
  getChallengeCompletionForUser,
  getTodayChallenge,
  recordDailyActivity,
} from "../services/gamificationService.js";
import { grantXPWithOptions } from "../services/xpService.js";
import UserStreak from "../models/UserStreak.js";
import DailyChallenge from "../models/DailyChallenge.js";
export const getMyStreak = asyncHandler(async (req, res) => {
  const streak = await UserStreak.findOne({ user: req.user._id });
  sendResponse(res, 200, "Streak fetched", { streak });
});

export const pingDailyActivity = asyncHandler(async (req, res) => {
  const { streak, milestoneReward } = await recordDailyActivity(req.user._id);
  const badges = await awardEligibleBadges(req.user._id);
  sendResponse(res, 200, "Daily activity recorded", { streak, newBadges: badges, milestoneReward });
});

export const getDailyChallenge = asyncHandler(async (req, res) => {
  const challenge = await getTodayChallenge();
  const completion = challenge
    ? await getChallengeCompletionForUser(req.user._id, challenge._id)
    : null;
  sendResponse(res, 200, "Daily challenge", {
    challenge,
    completed: Boolean(completion),
    completedAt: completion?.completedAt ?? null,
  });
});

export const completeDailyChallenge = asyncHandler(async (req, res) => {
  const challenge = await getTodayChallenge();
  if (!challenge) {
    throw new ApiError(404, "No active daily challenge for today");
  }

  const existing = await getChallengeCompletionForUser(req.user._id, challenge._id);
  if (existing) {
    return sendResponse(res, 200, "Daily challenge already completed", {
      challenge,
      completion: existing,
      alreadyCompleted: true,
      xp: null,
    });
  }

  const completion = await DailyChallengeCompletion.create({
    user: req.user._id,
    challenge: challenge._id,
  });

  const { user, log } = await grantXPWithOptions({
    userId: req.user._id,
    amount: challenge.xpReward ?? 25,
    reason: `Daily challenge: ${challenge.title}`,
    sourceType: "daily_challenge",
    sourceId: challenge._id,
    enforceUniqueSource: true,
    allowExisting: true,
  });

  const newBadges = await awardEligibleBadges(req.user._id).catch(() => []);

  sendResponse(res, 200, "Daily challenge completed", {
    challenge,
    completion,
    alreadyCompleted: false,
    xp: log?.amount ?? challenge.xpReward,
    user,
    newBadges,
  });
});

export const createDailyChallenge = asyncHandler(async (req, res) => {
  const { title, description, xpReward, activeDate, isActive } = req.body;
  if (!title || typeof title !== "string" || title.trim().length < 2) {
    throw new ApiError(400, "title is required (min 2 characters)");
  }
  const challenge = await DailyChallenge.create({
    title: title.trim(),
    description: typeof description === "string" ? description.trim() : undefined,
    xpReward: typeof xpReward === "number" && xpReward > 0 ? xpReward : 25,
    activeDate: activeDate ? new Date(activeDate) : new Date(),
    isActive: typeof isActive === "boolean" ? isActive : true,
  });
  sendResponse(res, 201, "Daily challenge created", { challenge });
});
