import jwt from "jsonwebtoken";

const LIVE_CLASSROOM_EXPIRY = "2h";

export const buildLiveRoomId = (sessionId) => `session-${sessionId}`;

export const generateLiveAccessToken = ({ sessionId, userId, role, roomId }) => {
  const secret = process.env.LIVE_CLASSROOM_SECRET || process.env.JWT_SECRET || "dev-live-classroom-secret";

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
