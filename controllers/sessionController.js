import Session from "../models/Session.js";
import User from "../models/User.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { sendResponse } from "../utils/apiResponse.js";
import { grantXP } from "../services/xpService.js";

export const createSession = asyncHandler(async (req, res) => {
  const session = await Session.create({ ...req.body, mentor: req.user._id });
  sendResponse(res, 201, "Session created", { session });
});

export const getSessions = asyncHandler(async (req, res) => {
  const { status, mentor } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (mentor) filter.mentor = mentor;

  const sessions = await Session.find(filter)
    .sort({ scheduledAt: 1 })
    .populate("mentor", "fullName")
    .populate("participants", "fullName role");

  sendResponse(res, 200, "Sessions fetched", { sessions });
});

export const updateSession = asyncHandler(async (req, res) => {
  const session = await Session.findById(req.params.id);
  if (!session) throw new ApiError(404, "Session not found");

  if (String(session.mentor) !== String(req.user._id) && req.user.role !== "admin") {
    throw new ApiError(403, "Only assigned mentor/admin can update session");
  }

  Object.assign(session, req.body);
  await session.save();
  sendResponse(res, 200, "Session updated", { session });
});

export const joinSession = asyncHandler(async (req, res) => {
  const session = await Session.findByIdAndUpdate(
    req.params.id,
    { $addToSet: { participants: req.user._id } },
    { new: true }
  ).populate("participants", "fullName");

  if (!session) throw new ApiError(404, "Session not found");
  sendResponse(res, 200, "Joined session", { session });
});

export const leaveSession = asyncHandler(async (req, res) => {
  const session = await Session.findByIdAndUpdate(
    req.params.id,
    { $pull: { participants: req.user._id } },
    { new: true }
  ).populate("participants", "fullName");

  if (!session) throw new ApiError(404, "Session not found");
  sendResponse(res, 200, "Left session", { session });
});

export const endSession = asyncHandler(async (req, res) => {
  const session = await Session.findById(req.params.id);
  if (!session) throw new ApiError(404, "Session not found");

  if (String(session.mentor) !== String(req.user._id) && req.user.role !== "admin") {
    throw new ApiError(403, "Only assigned mentor/admin can end session");
  }

  session.status = "ended";
  await session.save();

  for (const participantId of session.participants) {
    await grantXP({
      userId: participantId,
      amount: session.xpPerAttendee || 0,
      reason: `Attended session: ${session.title}`,
      sourceType: "session",
      sourceId: session._id,
    });
  }

  await User.findByIdAndUpdate(session.mentor, {
    $inc: { mentorScore: 10, totalSessions: 1 },
  });

  sendResponse(res, 200, "Session ended and attendance XP awarded", { session });
});
