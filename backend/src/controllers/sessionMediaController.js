import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { sendResponse } from "../utils/apiResponse.js";
import Session from "../models/Session.js";
import SessionAuditLog from "../models/SessionAuditLog.js";

export const toggleScreenShare = asyncHandler(async (req, res) => {
  const session = await Session.findById(req.params.id);
  if (!session) throw new ApiError(404, "Session not found");

  if (session.status !== "live") {
    throw new ApiError(400, "Screen share is only available during live sessions");
  }

  if (session.screenShareActive) {
    session.screenShareActive = false;
    session.screenShareUserId = undefined;
  } else {
    session.screenShareActive = true;
    session.screenShareUserId = req.user._id;
  }

  await session.save();

  await SessionAuditLog.create({
    session: session._id,
    action: "moderation",
    actor: req.user._id,
    metadata: {
      action: session.screenShareActive ? "screen_share_started" : "screen_share_stopped",
      userId: req.user._id,
    },
    ip: req.ip,
  });

  sendResponse(res, 200, "Screen share toggled", {
    screenShareActive: session.screenShareActive,
    screenShareUserId: session.screenShareUserId,
  });
});

export const startRecording = asyncHandler(async (req, res) => {
  const session = await Session.findById(req.params.id);
  if (!session) throw new ApiError(404, "Session not found");

  if (session.status !== "live") {
    throw new ApiError(400, "Recording is only available during live sessions");
  }

  if (session.recordingMode === "cloud" && session.recordingUrl) {
    throw new ApiError(400, "Recording is already in progress");
  }

  session.recordingMode = "cloud";
  await session.save();

  await SessionAuditLog.create({
    session: session._id,
    action: "moderation",
    actor: req.user._id,
    metadata: { action: "recording_started" },
    ip: req.ip,
  });

  sendResponse(res, 200, "Recording started", {
    recordingMode: session.recordingMode,
  });
});

export const stopRecording = asyncHandler(async (req, res) => {
  const session = await Session.findById(req.params.id);
  if (!session) throw new ApiError(404, "Session not found");

  session.recordingMode = "none";
  await session.save();

  await SessionAuditLog.create({
    session: session._id,
    action: "moderation",
    actor: req.user._id,
    metadata: { action: "recording_stopped" },
    ip: req.ip,
  });

  sendResponse(res, 200, "Recording stopped", {
    recordingMode: session.recordingMode,
  });
});
