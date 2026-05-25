import MentorAvailability from "../models/MentorAvailability.js";
import Session from "../models/Session.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { sendResponse } from "../utils/apiResponse.js";

export const getMyAvailability = asyncHandler(async (req, res) => {
  const slots = await MentorAvailability.find({ mentor: req.user._id, isActive: true }).sort({
    dayOfWeek: 1,
    startMinutes: 1,
  });
  sendResponse(res, 200, "Availability fetched", { slots });
});

export const setMyAvailability = asyncHandler(async (req, res) => {
  const { slots } = req.body;
  if (!Array.isArray(slots) || !slots.length) {
    throw new ApiError(400, "At least one availability slot is required");
  }

  await MentorAvailability.deleteMany({ mentor: req.user._id });
  const created = await MentorAvailability.insertMany(
    slots.map((slot) => ({
      mentor: req.user._id,
      dayOfWeek: slot.dayOfWeek,
      startMinutes: slot.startMinutes,
      endMinutes: slot.endMinutes,
      timezone: slot.timezone ?? "Africa/Addis_Ababa",
      isActive: true,
    }))
  );

  sendResponse(res, 200, "Availability updated", { slots: created });
});

export const requestMentorSession = asyncHandler(async (req, res) => {
  const { mentorId, title, scheduledAt, durationMinutes } = req.body;
  if (!mentorId || !title || !scheduledAt) {
    throw new ApiError(400, "mentorId, title, and scheduledAt are required");
  }

  const session = await Session.create({
    title,
    mentor: mentorId,
    participants: [req.user._id],
    scheduledAt: new Date(scheduledAt),
    durationMinutes: durationMinutes ?? 60,
    status: "scheduled",
  });

  sendResponse(res, 201, "Session requested", { session });
});
