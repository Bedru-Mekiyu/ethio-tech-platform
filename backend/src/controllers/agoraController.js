import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { sendResponse } from "../utils/apiResponse.js";
import Session from "../models/Session.js";
import SessionParticipant from "../models/SessionParticipant.js";
import SessionAuditLog from "../models/SessionAuditLog.js";
import {
  generateRtcToken,
  generateRtmToken,
  buildChannelName,
  getAgoraConfigSafe,
} from "../services/agoraService.js";

export const getAgoraConfig = asyncHandler(async (_req, res) => {
  const config = getAgoraConfigSafe();
  sendResponse(res, 200, "Agora config", config);
});

export const getAgoraToken = asyncHandler(async (req, res) => {
  const session = await Session.findById(req.params.id);
  if (!session) throw new ApiError(404, "Session not found");

  if (!["live", "scheduled", "paused"].includes(session.status)) {
    throw new ApiError(400, "Agora token is only available for active sessions");
  }

  const isMentor = String(session.mentor) === String(req.user._id);
  const isAdmin = req.user.role === "admin" || req.user.role === "super_admin";
  const participant = await SessionParticipant.findOne({
    session: session._id,
    user: req.user._id,
  });

  if (!isMentor && !isAdmin && !participant) {
    throw new ApiError(403, "Only session participants can request a token");
  }

  if (participant?.admissionStatus === "denied") {
    throw new ApiError(403, "Admission denied");
  }

  const channelName = buildChannelName(session._id);
  const uid = req.user._id.toString();
  const role = isMentor || isAdmin ? "publisher" : "publisher";

  const rtcToken = generateRtcToken(channelName, uid, role);
  const rtmToken = generateRtmToken(uid);

  sendResponse(res, 200, "Agora tokens generated", {
    rtcToken,
    rtmToken,
    channelName,
    appId: getAgoraConfigSafe().appId,
    uid,
    role,
  });
});

export const toggleScreenShare = asyncHandler(async (req, res) => {
  const session = await Session.findById(req.params.id);
  if (!session) throw new ApiError(404, "Session not found");

  if (session.status !== "live") {
    throw new ApiError(400, "Screen share is only available during live sessions");
  }

  const isMentor = String(session.mentor) === String(req.user._id);
  const isAdmin = req.user.role === "admin" || req.user.role === "super_admin";
  const participant = await SessionParticipant.findOne({
    session: session._id,
    user: req.user._id,
  });

  const isCohost = participant?.role === "cohost";

  if (!isMentor && !isAdmin && !isCohost) {
    throw new ApiError(403, "Only host or co-host can toggle screen share");
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

  const isMentor = String(session.mentor) === String(req.user._id);
  const isAdmin = req.user.role === "admin" || req.user.role === "super_admin";

  if (!isMentor && !isAdmin) {
    throw new ApiError(403, "Only host can start recording");
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

  const isMentor = String(session.mentor) === String(req.user._id);
  const isAdmin = req.user.role === "admin" || req.user.role === "super_admin";

  if (!isMentor && !isAdmin) {
    throw new ApiError(403, "Only host can stop recording");
  }

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
