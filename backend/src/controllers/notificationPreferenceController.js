import NotificationPreference from "../models/NotificationPreference.js";
import asyncHandler from "../utils/asyncHandler.js";
import { sendResponse } from "../utils/apiResponse.js";

export const getPreferences = asyncHandler(async (req, res) => {
  let prefs = await NotificationPreference.findOne({ user: req.user._id });
  if (!prefs) {
    prefs = await NotificationPreference.create({ user: req.user._id });
  }
  sendResponse(res, 200, "Preferences fetched", { preferences: prefs.preferences });
});

export const updatePreferences = asyncHandler(async (req, res) => {
  const prefs = await NotificationPreference.findOneAndUpdate(
    { user: req.user._id },
    { $set: { preferences: req.body.preferences } },
    { new: true, upsert: true },
  );
  sendResponse(res, 200, "Preferences updated", { preferences: prefs.preferences });
});
