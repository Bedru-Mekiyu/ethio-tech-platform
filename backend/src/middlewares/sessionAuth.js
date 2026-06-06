import SessionParticipant from "../models/SessionParticipant.js";
import Session from "../models/Session.js";
import ApiError from "../utils/ApiError.js";

const ROLE_HIERARCHY = {
  observer: 0,
  participant: 1,
  moderator: 2,
  cohost: 3,
  host: 4,
};

export const requireSessionRole = (...requiredRoles) => {
  return async (req, res, next) => {
    try {
      const sessionId = req.params.id;
      if (!sessionId) {
        throw new ApiError(400, "Session ID required");
      }

      const session = await Session.findById(sessionId).select("mentor");
      if (!session) {
        throw new ApiError(404, "Session not found");
      }

      // Session mentor always has host-level access
      if (String(session.mentor) === String(req.user._id)) {
        return next();
      }

      // Admin bypasses all role checks
      if (req.user.role === "admin") {
        return next();
      }

      const participant = await SessionParticipant.findOne({
        session: sessionId,
        user: req.user._id,
      }).select("role");

      if (!participant) {
        throw new ApiError(403, "You are not a participant in this session");
      }

      const userRoleLevel = ROLE_HIERARCHY[participant.role] ?? -1;
      const minRequired = Math.min(...requiredRoles.map((r) => ROLE_HIERARCHY[r] ?? -1));

      if (userRoleLevel < minRequired) {
        throw new ApiError(403, "Insufficient role privileges for this session");
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

export const getSessionRole = async (userId, sessionId) => {
  if (!userId || !sessionId) return null;

  const session = await Session.findById(sessionId).select("mentor");
  if (!session) return null;

  if (String(session.mentor) === String(userId)) return "host";

  const participant = await SessionParticipant.findOne({
    session: sessionId,
    user: userId,
  }).select("role");

  return participant?.role ?? null;
};

export const requireSessionParticipant = async (req, res, next) => {
  try {
    const sessionId = req.params.id || req.params.sessionId;
    if (!sessionId) {
      throw new ApiError(400, "Session ID required");
    }

    const session = await Session.findById(sessionId).select("mentor");
    if (!session) {
      throw new ApiError(404, "Session not found");
    }

    if (String(session.mentor) === String(req.user._id)) {
      return next();
    }

    if (req.user.role === "admin" || req.user.role === "super_admin") {
      return next();
    }

    const participant = await SessionParticipant.findOne({
      session: sessionId,
      user: req.user._id,
    }).select("_id admissionStatus blockedAt");

    if (!participant) {
      throw new ApiError(403, "You are not a participant in this session");
    }

    if (participant.admissionStatus === "denied") {
      throw new ApiError(403, "Admission denied");
    }

    if (participant.blockedAt) {
      throw new ApiError(403, "You have been blocked from this session");
    }

    next();
  } catch (error) {
    next(error);
  }
};

export const ROLE_PERMISSIONS = {
  startSession: ["host", "cohost"],
  endSession: ["host", "cohost"],
  cancelSession: ["host"],
  rescheduleSession: ["host"],
  admitFromWaitingRoom: ["host", "cohost"],
  denyFromWaitingRoom: ["host", "cohost"],
  removeParticipant: ["host", "cohost"],
  muteAll: ["host", "cohost", "moderator"],
  muteUser: ["host", "cohost", "moderator"],
  lockChat: ["host", "cohost"],
  deleteMessage: ["host", "cohost", "moderator"],
  viewAttendance: ["host", "cohost", "moderator"],
  setCohost: ["host"],
  setModerator: ["host", "cohost"],
};
