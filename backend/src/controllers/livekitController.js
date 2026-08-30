import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { sendResponse } from "../utils/apiResponse.js";
import Session from "../models/Session.js";
import SessionParticipant from "../models/SessionParticipant.js";
import {
  generateRoomName,
  generateLiveKitToken,
  getPublicLiveKitConfig,
  muteParticipantTrack,
  removeParticipantFromRoom,
  getWebhookReceiver,
} from "../services/livekitService.js";
import { logger } from "../lib/logger.js";
import { getSocketIO } from "../services/notificationHelper.js";

export const getLiveKitConfig = asyncHandler(async (_req, res) => {
  const config = getPublicLiveKitConfig();
  sendResponse(res, 200, "LiveKit config", config);
});

export const getLiveKitToken = asyncHandler(async (req, res) => {
  const session = await Session.findById(req.params.id);
  if (!session) throw new ApiError(404, "Session not found");

  if (!["live", "scheduled", "paused"].includes(session.status)) {
    throw new ApiError(400, "Meeting token is only available for active or scheduled sessions");
  }

  const isMentor = String(session.mentor) === String(req.user._id);
  const isAdmin = req.user.role === "admin" || req.user.role === "super_admin";
  const participant = await SessionParticipant.findOne({
    session: session._id,
    user: req.user._id,
  });

  if (!isMentor && !isAdmin && !participant) {
    throw new ApiError(403, "Only session participants can request a meeting token");
  }

  if (participant?.admissionStatus === "denied") {
    throw new ApiError(403, "Admission denied");
  }

  if (participant?.blockedAt) {
    throw new ApiError(403, "You have been blocked from this session");
  }

  const roomName = session.liveRoomId || generateRoomName(session._id);
  const role = isMentor || isAdmin ? "host" : "participant";

  const tokenData = await generateLiveKitToken({
    sessionId: session._id,
    user: req.user,
    role,
    roomName,
  });

  sendResponse(res, 200, "Meeting token generated", {
    token: tokenData.token,
    url: tokenData.url,
    roomName: tokenData.roomName,
    role: tokenData.role,
    identity: tokenData.identity,
    name: tokenData.name,
    sessionId: session._id,
  });
});

export const getMeetingInfo = asyncHandler(async (req, res) => {
  const session = await Session.findById(req.params.id).select(
    "title status liveStartedAt liveEndedAt maxParticipants admissionMode liveRoomId liveProvider",
  );
  if (!session) throw new ApiError(404, "Session not found");

  const participantCount = await SessionParticipant.countDocuments({
    session: session._id,
    status: { $in: ["joined", "active", "registered"] },
  });

  const roomName = session.liveRoomId || generateRoomName(session._id);

  sendResponse(res, 200, "Meeting info", {
    sessionId: session._id,
    title: session.title,
    status: session.status,
    roomName,
    url: getPublicLiveKitConfig().url,
    provider: "livekit",
    participantCount,
    maxParticipants: session.maxParticipants,
    liveStartedAt: session.liveStartedAt,
    liveEndedAt: session.liveEndedAt,
  });
});

export const muteRemoteParticipant = asyncHandler(async (req, res) => {
  const session = await Session.findById(req.params.id);
  if (!session) throw new ApiError(404, "Session not found");

  const isMentor = String(session.mentor) === String(req.user._id);
  const isAdmin = req.user.role === "admin" || req.user.role === "super_admin";
  if (!isMentor && !isAdmin) {
    throw new ApiError(403, "Only mentor or admin can mute participants");
  }

  const { identity, trackSid, muted = true } = req.body;
  if (!identity || !trackSid) {
    throw new ApiError(400, "identity and trackSid are required");
  }

  const roomName = session.liveRoomId || generateRoomName(session._id);
  try {
    await muteParticipantTrack({ roomName, identity, trackSid, muted });
  } catch (err) {
    logger.warn("Failed to mute participant track via LiveKit SDK", { error: err?.message });
  }

  const io = getSocketIO();
  if (io) {
    io.to(`session-${session._id}`).emit("participant:mute-state", {
      identity,
      trackSid,
      muted,
      by: req.user._id,
    });
  }

  sendResponse(res, 200, "Participant track updated", { identity, trackSid, muted });
});

export const kickParticipant = asyncHandler(async (req, res) => {
  const session = await Session.findById(req.params.id);
  if (!session) throw new ApiError(404, "Session not found");

  const isMentor = String(session.mentor) === String(req.user._id);
  const isAdmin = req.user.role === "admin" || req.user.role === "super_admin";
  if (!isMentor && !isAdmin) {
    throw new ApiError(403, "Only mentor or admin can kick participants");
  }

  const { identity } = req.body;
  if (!identity) throw new ApiError(400, "identity is required");

  const roomName = session.liveRoomId || generateRoomName(session._id);
  try {
    await removeParticipantFromRoom({ roomName, identity });
  } catch (err) {
    logger.warn("Failed to remove participant via LiveKit SDK", { error: err?.message });
  }

  const io = getSocketIO();
  if (io) {
    io.to(`session-${session._id}`).emit("participant:kicked", {
      identity,
      sessionId: session._id,
      by: req.user._id,
    });
  }

  sendResponse(res, 200, "Participant removed from live session", { identity });
});

export const handleLiveKitWebhook = asyncHandler(async (req, res) => {
  const receiver = getWebhookReceiver();
  const authHeader = req.headers.authorization;

  if (receiver && authHeader) {
    try {
      const event = await receiver.receive(req.body, authHeader);
      logger.info("LiveKit Webhook received", { event: event.event, room: event.room?.name });

      const io = getSocketIO();
      if (io && event.room?.name) {
        io.to(`livekit-${event.room.name}`).emit("livekit:event", {
          event: event.event,
          participant: event.participant?.identity,
          room: event.room?.name,
        });
      }
    } catch (err) {
      logger.warn("LiveKit Webhook validation failed", { error: err?.message });
      throw new ApiError(401, "Invalid webhook signature");
    }
  }

  res.status(200).send("OK");
});
