import jwt from "jsonwebtoken";
import { getEnv } from "../config/env.js";
import Session from "../models/Session.js";
import SessionParticipant from "../models/SessionParticipant.js";

const LIVE_CLASSROOM_EXPIRY = "2h";

export const buildLiveRoomId = (sessionId) => `session-${sessionId}`;

export const generateLiveAccessToken = ({ sessionId, userId, role, roomId }) => {
  const secret = getEnv().liveClassroomSecret;

  return jwt.sign(
    {
      type: "live-classroom",
      sessionId: String(sessionId),
      userId: String(userId),
      role,
      roomId,
    },
    secret,
    { expiresIn: LIVE_CLASSROOM_EXPIRY }
  );
};

export const validateLiveAccessToken = async (token, expectedUserId) => {
  if (!token) return { valid: false, reason: "No token provided" };

  let payload;
  try {
    payload = jwt.verify(token, getEnv().liveClassroomSecret);
  } catch (err) {
    if (err.name === "TokenExpiredError") return { valid: false, reason: "Token expired" };
    return { valid: false, reason: "Invalid token" };
  }

  if (payload.type !== "live-classroom") {
    return { valid: false, reason: "Not a live classroom token" };
  }

  if (String(payload.userId) !== String(expectedUserId)) {
    return { valid: false, reason: "Token user mismatch" };
  }

  const session = await Session.findById(payload.sessionId);
  if (!session) return { valid: false, reason: "Session not found" };

  if (["ended", "canceled"].includes(session.status)) {
    return { valid: false, reason: "Session is no longer active" };
  }

  const participant = await SessionParticipant.findOne({
    session: payload.sessionId,
    user: expectedUserId,
  });

  if (participant) {
    if (participant.admissionStatus === "denied") {
      return { valid: false, reason: "Admission denied" };
    }
  }

  return { valid: true, payload, role: participant?.role || "observer" };
};
