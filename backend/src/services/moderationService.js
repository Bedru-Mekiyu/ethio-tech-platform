import ModerationLog from "../models/ModerationLog.js";
import ChatMessage from "../models/ChatMessage.js";
import SessionParticipant from "../models/SessionParticipant.js";
import SessionAuditLog from "../models/SessionAuditLog.js";

const SPAM_PATTERNS = [
  /(https?:\/\/[^\s]+){3,}/gi,
  /(\b\w+\b\s*\1\s*){5,}/gi,
  /[A-Z\s]{20,}/g,
  /(\b(buy|cheap|click|free|money|offer|price|subscribe|win)\b.*){3,}/gi,
];

const FLOOD_WINDOW_MS = 5000;
const FLOOD_MAX_MESSAGES = 5;
const messageTimestamps = new Map();

let timeoutTimestamps = new Map();

export const checkSpam = (text) => {
  for (const pattern of SPAM_PATTERNS) {
    if (pattern.test(text)) return true;
  }
  return false;
};

export const checkFlood = (userId) => {
  const now = Date.now();
  const timestamps = messageTimestamps.get(userId) || [];
  const recent = timestamps.filter((t) => now - t < FLOOD_WINDOW_MS);
  recent.push(now);
  messageTimestamps.set(userId, recent);
  return recent.length > FLOOD_MAX_MESSAGES;
};

export const deleteMessage = async ({ messageId, sessionId, actorId, reason, ip }) => {
  const message = await ChatMessage.findById(messageId);
  if (!message) throw new Error("Message not found");
  const deletedText = message.text;
  await message.deleteOne();
  await ModerationLog.create({
    session: sessionId,
    action: "message_deleted",
    actor: actorId,
    targetMessage: messageId,
    targetUser: message.userId,
    reason: reason?.trim(),
    ip,
    metadata: { deletedText },
  });
  await SessionAuditLog.create({
    session: sessionId,
    action: "moderation",
    actor: actorId,
    targetUser: message.userId,
    metadata: { action: "message_deleted", messageId, reason },
    ip,
  });
  return { deleted: true, originalUserId: message.userId };
};

export const muteUser = async ({ sessionId, userId, actorId, durationMinutes, reason, ip }) => {
  const participant = await SessionParticipant.findOne({ session: sessionId, user: userId });
  if (!participant) throw new Error("User not in session");
  const expiresAt = durationMinutes ? new Date(Date.now() + durationMinutes * 60 * 1000) : null;
  const mutedUntil = expiresAt || new Date(Date.now() + 24 * 60 * 60 * 1000);
  participant.metadata = { ...(participant.metadata || {}), mutedUntil, mutedBy: actorId, mutedReason: reason };
  await participant.save();
  await ModerationLog.create({
    session: sessionId,
    action: "user_muted",
    actor: actorId,
    targetUser: userId,
    reason: reason?.trim(),
    duration: durationMinutes,
    expiresAt,
    ip,
  });
  await SessionAuditLog.create({
    session: sessionId,
    action: "moderation",
    actor: actorId,
    targetUser: userId,
    metadata: { action: "user_muted", durationMinutes, reason },
    ip,
  });
  return { muted: true, expiresAt };
};

export const unmuteUser = async ({ sessionId, userId, actorId, ip }) => {
  const participant = await SessionParticipant.findOne({ session: sessionId, user: userId });
  if (!participant) throw new Error("User not in session");
  if (participant.metadata) {
    delete participant.metadata.mutedUntil;
    await participant.save();
  }
  await ModerationLog.create({
    session: sessionId,
    action: "user_unmuted",
    actor: actorId,
    targetUser: userId,
    ip,
  });
  return { unmuted: true };
};

export const timeoutUser = async ({ sessionId, userId, actorId, durationMinutes, reason, ip }) => {
  const expiresAt = new Date(Date.now() + durationMinutes * 60 * 1000);
  const participant = await SessionParticipant.findOne({ session: sessionId, user: userId });
  if (participant) {
    participant.metadata = {
      ...(participant.metadata || {}),
      timedOutUntil: expiresAt,
      timedOutBy: actorId,
      timedOutReason: reason?.trim(),
    };
    await participant.save();
  }

  await ModerationLog.create({
    session: sessionId,
    action: "user_timeout",
    actor: actorId,
    targetUser: userId,
    reason: reason?.trim(),
    duration: durationMinutes,
    expiresAt,
    ip,
  });
  await SessionAuditLog.create({
    session: sessionId,
    action: "moderation",
    actor: actorId,
    targetUser: userId,
    metadata: { action: "user_timeout", durationMinutes, reason, expiresAt },
    ip,
  });
  return { timedOut: true, expiresAt };
};

export const removeParticipant = async ({ sessionId, userId, actorId, reason, ip }) => {
  await SessionParticipant.findOneAndUpdate(
    { session: sessionId, user: userId },
    { status: "completed", leftAt: new Date() }
  );
  await ModerationLog.create({
    session: sessionId,
    action: "user_removed",
    actor: actorId,
    targetUser: userId,
    reason: reason?.trim(),
    ip,
  });
  await SessionAuditLog.create({
    session: sessionId,
    action: "moderation",
    actor: actorId,
    targetUser: userId,
    metadata: { action: "user_removed", reason },
    ip,
  });
  return { removed: true };
};

export const blockUser = async ({ sessionId, userId, actorId, reason, ip }) => {
  const participant = await SessionParticipant.findOne({ session: sessionId, user: userId });
  if (participant) {
    participant.metadata = {
      ...(participant.metadata || {}),
      blocked: true,
    };
    participant.blockedAt = new Date();
    participant.blockedBy = actorId;
    participant.status = "completed";
    await participant.save();
  }

  await ModerationLog.create({
    session: sessionId,
    action: "user_blocked",
    actor: actorId,
    targetUser: userId,
    reason: reason?.trim(),
    ip,
  });
  await SessionAuditLog.create({
    session: sessionId,
    action: "moderation",
    actor: actorId,
    targetUser: userId,
    metadata: { action: "user_blocked", reason },
    ip,
  });
  return { blocked: true };
};

export const reportAbuse = async ({ sessionId, userId, reportedUserId, messageId, reason, ip }) => {
  await ModerationLog.create({
    session: sessionId,
    action: "abuse_reported",
    actor: userId,
    targetUser: reportedUserId,
    targetMessage: messageId,
    reason: reason?.trim(),
    ip,
  });
  return { reported: true };
};

export const isUserMuted = async (sessionId, userId) => {
  const participant = await SessionParticipant.findOne({ session: sessionId, user: userId }).select("metadata");
  if (!participant?.metadata?.mutedUntil) return false;
  return new Date(participant.metadata.mutedUntil) > new Date();
};

export const isUserTimedOut = async (userId, sessionId) => {
  const query = { user: userId };
  if (sessionId) {
    query.session = sessionId;
  }
  const participants = await SessionParticipant.find(query).select("metadata");
  const now = new Date();
  for (const p of participants) {
    if (p.metadata?.timedOutUntil && new Date(p.metadata.timedOutUntil) > now) {
      return true;
    }
  }
  return false;
};

export const getModerationLogs = async (sessionId, limit = 50) => {
  return ModerationLog.find({ session: sessionId })
    .populate("actor", "fullName")
    .populate("targetUser", "fullName")
    .sort({ createdAt: -1 })
    .limit(limit);
};
