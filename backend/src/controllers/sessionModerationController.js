import asyncHandler from "../utils/asyncHandler.js";
import { sendResponse } from "../utils/apiResponse.js";
import ApiError from "../utils/ApiError.js";
import * as moderationService from "../services/moderationService.js";

export const deleteMessage = asyncHandler(async (req, res) => {
  const { messageId, reason } = req.body;
  if (!messageId) throw new ApiError(400, "messageId is required");
  await moderationService.deleteMessage({
    messageId,
    sessionId: req.params.sessionId,
    actorId: req.user._id,
    reason,
    ip: req.ip,
  });
  sendResponse(res, 200, "Message deleted");
});

export const muteUser = asyncHandler(async (req, res) => {
  const { userId, durationMinutes, reason } = req.body;
  if (!userId) throw new ApiError(400, "userId is required");
  const result = await moderationService.muteUser({
    sessionId: req.params.sessionId,
    userId,
    actorId: req.user._id,
    durationMinutes: durationMinutes || 30,
    reason,
    ip: req.ip,
  });
  sendResponse(res, 200, "User muted", result);
});

export const unmuteUser = asyncHandler(async (req, res) => {
  const { userId } = req.body;
  if (!userId) throw new ApiError(400, "userId is required");
  await moderationService.unmuteUser({
    sessionId: req.params.sessionId,
    userId,
    actorId: req.user._id,
    ip: req.ip,
  });
  sendResponse(res, 200, "User unmuted");
});

export const timeoutUser = asyncHandler(async (req, res) => {
  const { userId, durationMinutes, reason } = req.body;
  if (!userId) throw new ApiError(400, "userId is required");
  const result = await moderationService.timeoutUser({
    sessionId: req.params.sessionId,
    userId,
    actorId: req.user._id,
    durationMinutes: durationMinutes || 5,
    reason,
    ip: req.ip,
  });
  sendResponse(res, 200, "User timed out", result);
});

export const removeParticipant = asyncHandler(async (req, res) => {
  const { userId, reason } = req.body;
  if (!userId) throw new ApiError(400, "userId is required");
  await moderationService.removeParticipant({
    sessionId: req.params.sessionId,
    userId,
    actorId: req.user._id,
    reason,
    ip: req.ip,
  });
  sendResponse(res, 200, "Participant removed");
});

export const reportAbuse = asyncHandler(async (req, res) => {
  const { reportedUserId, messageId, reason } = req.body;
  if (!reportedUserId) throw new ApiError(400, "reportedUserId is required");
  await moderationService.reportAbuse({
    sessionId: req.params.sessionId,
    userId: req.user._id,
    reportedUserId,
    messageId,
    reason,
    ip: req.ip,
  });
  sendResponse(res, 200, "Abuse reported");
});

export const getModerationLogs = asyncHandler(async (req, res) => {
  const logs = await moderationService.getModerationLogs(req.params.sessionId);
  sendResponse(res, 200, "Moderation logs", { logs });
});
