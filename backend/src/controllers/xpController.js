import XPLog from "../models/XPLog.js";
import User from "../models/User.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { sendResponse } from "../utils/apiResponse.js";
import { grantXP } from "../services/xpService.js";

export const grantXpManual = asyncHandler(async (req, res) => {
  const { userId, amount, reason, sourceType, sourceId } = req.body;
  if (!userId || !amount || !reason) {
    throw new ApiError(400, "userId, amount and reason are required");
  }

  const result = await grantXP({ userId, amount, reason, sourceType, sourceId });
  sendResponse(res, 200, "XP granted", {
    user: { id: result.user._id, xp: result.user.xp, level: result.user.level },
    log: result.log,
  });
});

export const getMyXpHistory = asyncHandler(async (req, res) => {
  const logs = await XPLog.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(50);
  sendResponse(res, 200, "XP history fetched", { logs });
});

export const getMyXpSummary = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select("xp level badges").populate("badges", "name category xpBonus");
  sendResponse(res, 200, "XP summary fetched", { user });
});
