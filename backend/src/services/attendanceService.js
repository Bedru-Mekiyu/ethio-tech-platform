import Session from "../models/Session.js";
import SessionParticipant from "../models/SessionParticipant.js";
import SessionAuditLog from "../models/SessionAuditLog.js";
import { grantXPWithOptions } from "./xpService.js";

const HEARTBEAT_FLUSH_INTERVAL_MS = 60_000;
const ATTENDANCE_THRESHOLD_FRACTION = 0.5;
const ATTENDANCE_THRESHOLD_MIN_MS = 30 * 60 * 1000;

const heartbeatBuffer = new Map();

let flushTimer = null;

const flushHeartbeats = async () => {
  if (heartbeatBuffer.size === 0) return;
  const batch = Array.from(heartbeatBuffer.entries());
  heartbeatBuffer.clear();

  const writes = [];
  for (const [key, entry] of batch) {
    const [sessionId, userId] = key.split("::");
    if (entry.deltaMs <= 0) continue;
    writes.push({
      updateOne: {
        filter: { session: sessionId, user: userId },
        update: {
          $inc: { totalPresenceMs: entry.deltaMs },
          $set: { lastHeartbeatAt: new Date(entry.lastTs), status: "active" },
        },
      },
    });
  }

  if (writes.length === 0) return;

  try {
    await SessionParticipant.bulkWrite(writes, { ordered: false });
  } catch {
    // swallow transient write failures; next heartbeat will retry
  }
};

const flushRemainingDeltas = async (sessionId, userId) => {
  const key = `${sessionId}::${userId}`;
  const entry = heartbeatBuffer.get(key);
  if (!entry) return 0;

  const deltaMs = Math.max(0, Date.now() - entry.lastTs);
  heartbeatBuffer.delete(key);

  if (deltaMs <= 0) return 0;

  try {
    await SessionParticipant.findOneAndUpdate(
      { session: sessionId, user: userId },
      {
        $inc: { totalPresenceMs: deltaMs },
        $set: { lastHeartbeatAt: new Date(), status: "active" },
      }
    );
  } catch {
    return 0;
  }

  return deltaMs;
};

const startHeartbeatFlusher = () => {
  if (flushTimer) return;
  flushTimer = setInterval(flushHeartbeats, HEARTBEAT_FLUSH_INTERVAL_MS);
  flushTimer.unref?.();
};

export const recordJoin = async (sessionId, userId, ip) => {
  heartbeatBuffer.delete(`${sessionId}::${userId}`);

  const existing = await SessionParticipant.findOne({ session: sessionId, user: userId });
  const isReconnection = !!(existing && (existing.joinedAt || existing.leftAt));

  const updateFields = {
    status: "joined",
    joinedAt: new Date(),
    session: sessionId,
    user: userId,
    liveStatus: isReconnection ? "reconnected" : "active",
  };

  if (isReconnection) {
    updateFields.$inc = { reconnectionCount: 1 };
    updateFields.lastReconnectedAt = new Date();
  }

  await SessionParticipant.findOneAndUpdate(
    { session: sessionId, user: userId },
    isReconnection
      ? { $set: { status: "joined", joinedAt: new Date(), liveStatus: "reconnected", lastReconnectedAt: new Date() }, $inc: { reconnectionCount: 1 } }
      : {
          $set: updateFields,
          $setOnInsert: { totalPresenceMs: 0, verifiedAttendance: false, xpAwarded: false, reconnectionCount: 0 },
        },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  await SessionAuditLog.create({
    session: sessionId,
    action: isReconnection ? "user_reconnected" : "user_joined",
    actor: userId,
    targetUser: userId,
    metadata: { source: "socket", isReconnection },
    ip,
  });
};

export const recordHeartbeat = (sessionId, userId) => {
  startHeartbeatFlusher();
  const now = Date.now();
  const key = `${sessionId}::${userId}`;

  if (heartbeatBuffer.size >= 10000 && !heartbeatBuffer.has(key)) {
    const oldestKey = heartbeatBuffer.keys().next().value;
    if (oldestKey) heartbeatBuffer.delete(oldestKey);
  }

  const existing = heartbeatBuffer.get(key);
  if (existing) {
    const deltaMs = Math.max(0, now - existing.lastTs);
    existing.deltaMs += deltaMs;
    existing.lastTs = now;
  } else {
    heartbeatBuffer.set(key, { lastTs: now, deltaMs: 0 });
  }

  // update participant status to active in db asynchronously if needed
  SessionParticipant.updateOne(
    { session: sessionId, user: userId },
    { $set: { liveStatus: "active", lastHeartbeatAt: new Date() } }
  ).catch(() => undefined);
};

export const recordLeave = async (sessionId, userId, ip) => {
  await flushRemainingDeltas(sessionId, userId);

  const leftAt = new Date();

  await SessionParticipant.findOneAndUpdate(
    { session: sessionId, user: userId },
    { $set: { status: "completed", leftAt, liveStatus: "disconnected" } }
  );

  const participant = await SessionParticipant.findOne({ session: sessionId, user: userId });

  await SessionAuditLog.create({
    session: sessionId,
    action: "user_left",
    actor: userId,
    targetUser: userId,
    metadata: { source: "socket", totalPresenceMs: participant?.totalPresenceMs || 0 },
    ip,
  });
};

export const verifyAttendance = async (sessionId, userId) => {
  const [session, participant] = await Promise.all([
    Session.findById(sessionId),
    SessionParticipant.findOne({ session: sessionId, user: userId }),
  ]);

  if (!session || !participant) return false;
  if (!session.liveStartedAt) return false;

  const sessionEnd = session.liveEndedAt || new Date();
  const sessionDurationMs = sessionEnd.getTime() - session.liveStartedAt.getTime();

  const thresholdMs = Math.max(
    sessionDurationMs * ATTENDANCE_THRESHOLD_FRACTION,
    ATTENDANCE_THRESHOLD_MIN_MS
  );

  const presenceMs = participant.totalPresenceMs || 0;
  const verified = presenceMs >= thresholdMs;

  await SessionParticipant.findOneAndUpdate(
    { session: sessionId, user: userId },
    {
      $set: {
        verifiedAttendance: verified,
        attendedThreshold: verified,
      },
    }
  );

  return verified;
};

export const batchVerifySession = async (sessionId) => {
  const [session, participants] = await Promise.all([
    Session.findById(sessionId),
    SessionParticipant.find({ session: sessionId, status: { $in: ["joined", "active"] } }),
  ]);

  if (!session || !session.liveStartedAt) return [];

  const sessionEnd = session.liveEndedAt || new Date();
  const sessionDurationMs = sessionEnd.getTime() - session.liveStartedAt.getTime();
  const thresholdMs = Math.max(
    sessionDurationMs * ATTENDANCE_THRESHOLD_FRACTION,
    ATTENDANCE_THRESHOLD_MIN_MS
  );

  const results = [];
  const writes = [];

  for (const participant of participants) {
    const presenceMs = participant.totalPresenceMs || 0;
    const verified = presenceMs >= thresholdMs;

    writes.push({
      updateOne: {
        filter: { _id: participant._id },
        update: { $set: { verifiedAttendance: verified, attendedThreshold: verified } },
      },
    });

    results.push({ userId: participant.user, verified, totalPresenceMs: presenceMs });
  }

  if (writes.length > 0) {
    await SessionParticipant.bulkWrite(writes, { ordered: false });
  }

  return results;
};

export const grantXpToVerified = async (sessionId, xpAmount, title) => {
  const verifiedParticipants = await SessionParticipant.find({
    session: sessionId,
    verifiedAttendance: true,
    xpAwarded: false,
  });

  const results = [];

  for (const participant of verifiedParticipants) {
    try {
      const result = await grantXPWithOptions({
        userId: participant.user,
        amount: xpAmount || 80,
        reason: `Attended session: ${title || "Session"}`,
        sourceType: "session",
        sourceId: sessionId,
        enforceUniqueSource: true,
        allowExisting: true,
      });

      await SessionParticipant.findOneAndUpdate(
        { _id: participant._id },
        { $set: { xpAwarded: true, xpAwardedAt: new Date() } }
      );

      await SessionAuditLog.create({
        session: sessionId,
        action: "xp_awarded",
        actor: participant.user,
        targetUser: participant.user,
        metadata: { amount: xpAmount || 80, verified: true },
      });

      results.push({ userId: participant.user, success: true, skipped: result.skipped });
    } catch (err) {
      results.push({ userId: participant.user, success: false, error: err.message });
    }
  }

  return results;
};
