import Badge from "../models/Badge.js";
import User from "../models/User.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { sendResponse } from "../utils/apiResponse.js";
import { grantXPWithOptions } from "../services/xpService.js";

export const createBadge = asyncHandler(async (req, res) => {
  const badge = await Badge.create(req.body);
  sendResponse(res, 201, "Badge created", { badge });
});

export const getBadges = asyncHandler(async (req, res) => {
  const badges = await Badge.find().sort({ xpBonus: 1, name: 1 });
  sendResponse(res, 200, "Badges fetched", { badges });
});

export const assignBadge = asyncHandler(async (req, res) => {
  const { userId, badgeId } = req.body;
  if (!userId || !badgeId) throw new ApiError(400, "userId and badgeId are required");

  const badge = await Badge.findById(badgeId);
  if (!badge) throw new ApiError(404, "Badge not found");

  const existingUser = await User.findById(userId).select("badges");
  if (!existingUser) throw new ApiError(404, "User not found");

  const alreadyHasBadge = existingUser.badges.map(String).includes(String(badge._id));

  const user = await User.findByIdAndUpdate(
    userId,
    { $addToSet: { badges: badge._id } },
    { new: true }
  ).populate("badges", "name xpBonus category");

  if (!alreadyHasBadge && badge.xpBonus > 0) {
    await grantXPWithOptions({
      userId: user._id,
      amount: badge.xpBonus,
      reason: `Badge earned: ${badge.name}`,
      sourceType: "badge",
      sourceId: badge._id,
      enforceUniqueSource: true,
      allowExisting: true,
    });
  }

  sendResponse(res, 200, "Badge assigned", { user, badge });
});
