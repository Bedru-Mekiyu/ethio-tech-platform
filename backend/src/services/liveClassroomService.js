import jwt from "jsonwebtoken";
import { getEnv } from "../config/env.js";

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
