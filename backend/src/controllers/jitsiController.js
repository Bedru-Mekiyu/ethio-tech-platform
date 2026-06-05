import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { sendResponse } from "../utils/apiResponse.js";
import Session from "../models/Session.js";
import SessionParticipant from "../models/SessionParticipant.js";
import { generateRoomName, generateJwtToken, getPublicJitsiConfig } from "../services/jitsiService.js";

export const getJitsiConfig = asyncHandler(async (_req, res) => {
  const config = getPublicJitsiConfig();
  sendResponse(res, 200, "Jitsi config", config);
});

export const getJitsiToken = asyncHandler(async (req, res) => {
  const session = await Session.findById(req.params.id);
  if (!session) throw new ApiError(404, "Session not found");

  if (!["live", "scheduled", "paused"].includes(session.status)) {
    throw new ApiError(400, "Meeting token is only available for active sessions");
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

  const roomName = generateRoomName(session._id);
  const role = isMentor || isAdmin ? "moderator" : "participant";
  const token = generateJwtToken(roomName, req.user, role);

  sendResponse(res, 200, "Meeting token generated", {
    roomName,
    domain: getPublicJitsiConfig().domain,
    token,
    role,
    sessionId: session._id,
  });
});

export const getMeetingInfo = asyncHandler(async (req, res) => {
  const session = await Session.findById(req.params.id).select(
    "title status liveStartedAt liveEndedAt maxParticipants admissionMode",
  );
  if (!session) throw new ApiError(404, "Session not found");

  const participantCount = await SessionParticipant.countDocuments({
    session: session._id,
    status: { $in: ["joined", "active"] },
  });

  sendResponse(res, 200, "Meeting info", {
    sessionId: session._id,
    title: session.title,
    status: session.status,
    roomName: generateRoomName(session._id),
    domain: getPublicJitsiConfig().domain,
    participantCount,
    maxParticipants: session.maxParticipants,
    liveStartedAt: session.liveStartedAt,
    liveEndedAt: session.liveEndedAt,
  });
});
