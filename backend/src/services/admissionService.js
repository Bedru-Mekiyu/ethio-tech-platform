import Session from "../models/Session.js";
import SessionParticipant from "../models/SessionParticipant.js";
import SessionAuditLog from "../models/SessionAuditLog.js";
import { notifyUser } from "./notificationService.js";

export const isWaitingRoomActive = async (sessionId) => {
  const session = await Session.findById(sessionId).select("admissionMode status maxParticipants");
  if (!session) return false;
  return session.admissionMode === "waiting-room" && session.status === "live";
};

export const addToWaitingRoom = async ({ sessionId, userId, ip }) => {
  const session = await Session.findById(sessionId).select("admissionMode title");
  if (!session) throw new Error("Session not found");
  if (session.admissionMode !== "waiting-room") {
    throw new Error("Session does not use waiting room admission");
  }

  await SessionParticipant.findOneAndUpdate(
    { session: sessionId, user: userId },
    {
      session: sessionId,
      user: userId,
      status: "registered",
      admissionStatus: "waiting",
    },
    { upsert: true, setDefaultsOnInsert: true }
  );

  await SessionAuditLog.create({
    session: sessionId,
    action: "user_joined",
    actor: userId,
    targetUser: userId,
    metadata: { source: "waiting_room" },
    ip,
  });

  return { status: "waiting" };
};

export const admitUser = async ({ sessionId, userId, actorId, ip }) => {
  const session = await Session.findById(sessionId).select("admissionMode title");
  if (!session) throw new Error("Session not found");

  const participant = await SessionParticipant.findOne({ session: sessionId, user: userId });
  if (!participant) throw new Error("User is not in the waiting room");
  if (participant.admissionStatus !== "waiting") {
    throw new Error("User is not waiting for admission");
  }

  participant.status = "joined";
  participant.admissionStatus = "admitted";
  participant.joinedAt = new Date();
  await participant.save();

  await SessionAuditLog.create({
    session: sessionId,
    action: "user_admitted",
    actor: actorId,
    targetUser: userId,
    ip,
  });

  await notifyUser({
    recipientId: userId,
    type: "session",
    message: `You have been admitted to: ${session.title}`,
    link: `/sessions/${sessionId}`,
  });

  return participant;
};

export const denyUser = async ({ sessionId, userId, actorId, ip }) => {
  const session = await Session.findById(sessionId).select("admissionMode title");
  if (!session) throw new Error("Session not found");

  const participant = await SessionParticipant.findOne({ session: sessionId, user: userId });
  if (!participant) throw new Error("User is not in the waiting room");
  if (participant.admissionStatus !== "waiting") {
    throw new Error("User is not waiting for admission");
  }

  participant.admissionStatus = "denied";
  participant.status = "absent";
  await participant.save();

  await SessionAuditLog.create({
    session: sessionId,
    action: "user_denied",
    actor: actorId,
    targetUser: userId,
    ip,
  });

  await notifyUser({
    recipientId: userId,
    type: "session",
    message: `Your admission was denied for: ${session.title}`,
  });

  return participant;
};

export const getWaitingQueue = async (sessionId) => {
  return SessionParticipant.find({ session: sessionId, admissionStatus: "waiting" })
    .populate("user", "fullName avatar role")
    .sort({ createdAt: 1 });
};
