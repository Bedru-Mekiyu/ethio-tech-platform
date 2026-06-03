import WaitlistEntry from "../models/WaitlistEntry.js";
import Session from "../models/Session.js";
import SessionParticipant from "../models/SessionParticipant.js";
import SessionAuditLog from "../models/SessionAuditLog.js";
import { notifyUser } from "./notificationService.js";

export const joinWaitlist = async ({ sessionId, userId, ip }) => {
  const session = await Session.findById(sessionId).select("maxParticipants waitlistEnabled title");
  if (!session) throw new Error("Session not found");

  if (session.maxParticipants > 0) {
    const registeredCount = await SessionParticipant.countDocuments({
      session: sessionId,
      status: { $in: ["registered", "joined", "active"] },
    });
    if (registeredCount < session.maxParticipants) {
      throw new Error("Session is not full, join directly instead");
    }
  }

  const existing = await WaitlistEntry.findOne({ session: sessionId, user: userId });
  if (existing) {
    if (existing.status === "waiting") return existing;
    if (existing.status === "promoted") throw new Error("Already promoted from waitlist");
  }

  const lastEntry = await WaitlistEntry.findOne({ session: sessionId, status: "waiting" })
    .sort({ position: -1 })
    .select("position");

  const position = (lastEntry?.position ?? 0) + 1;

  const entry = await WaitlistEntry.create({
    session: sessionId,
    user: userId,
    position,
    status: "waiting",
  });

  await SessionParticipant.findOneAndUpdate(
    { session: sessionId, user: userId },
    {
      session: sessionId,
      user: userId,
      status: "waitlisted",
      waitlistPosition: position,
    },
    { upsert: true, setDefaultsOnInsert: true }
  );

  await SessionAuditLog.create({
    session: sessionId,
    action: "user_joined",
    actor: userId,
    targetUser: userId,
    metadata: { source: "waitlist", position },
    ip,
  });

  return entry;
};

export const cancelWaitlist = async ({ sessionId, userId, ip }) => {
  const entry = await WaitlistEntry.findOne({ session: sessionId, user: userId, status: "waiting" });
  if (!entry) throw new Error("Not on waitlist");

  entry.status = "cancelled";
  await entry.save();

  await SessionParticipant.findOneAndUpdate(
    { session: sessionId, user: userId },
    { status: "declined" }
  );

  await SessionAuditLog.create({
    session: sessionId,
    action: "user_left",
    actor: userId,
    targetUser: userId,
    metadata: { source: "waitlist_cancel" },
    ip,
  });

  await reindexPositions(sessionId);

  return entry;
};

const reindexPositions = async (sessionId) => {
  const waiting = await WaitlistEntry.find({ session: sessionId, status: "waiting" })
    .sort({ position: 1 });

  for (let i = 0; i < waiting.length; i++) {
    if (waiting[i].position !== i + 1) {
      waiting[i].position = i + 1;
      await waiting[i].save();
    }
  }
};

export const promoteNext = async (sessionId) => {
  const next = await WaitlistEntry.findOne({ session: sessionId, status: "waiting" })
    .sort({ position: 1 });

  if (!next) return null;

  next.status = "promoted";
  next.promotedAt = new Date();
  await next.save();

  await SessionParticipant.findOneAndUpdate(
    { session: sessionId, user: next.user },
    {
      session: sessionId,
      user: next.user,
      status: "registered",
      admissionStatus: "admitted",
    },
    { upsert: true, setDefaultsOnInsert: true }
  );

  await Session.findByIdAndUpdate(sessionId, { $addToSet: { participants: next.user } });

  const session = await Session.findById(sessionId).select("title");
  await notifyUser({
    recipientId: next.user,
    type: "session",
    message: `A seat opened up! You've been promoted from the waitlist for: ${session?.title || "session"}`,
    link: `/sessions/${sessionId}`,
  });

  await SessionAuditLog.create({
    session: sessionId,
    action: "user_promoted_from_waitlist",
    actor: next.user,
    targetUser: next.user,
    metadata: { position: next.position },
  });

  await reindexPositions(sessionId);

  return next;
};

export const getWaitlistStatus = async (sessionId, userId) => {
  const entry = await WaitlistEntry.findOne({ session: sessionId, user: userId });
  if (!entry) return { onWaitlist: false };

  return {
    onWaitlist: entry.status === "waiting",
    position: entry.position,
    status: entry.status,
    promotedAt: entry.promotedAt,
  };
};

export const getWaitlistCount = async (sessionId) => {
  return WaitlistEntry.countDocuments({ session: sessionId, status: "waiting" });
};
