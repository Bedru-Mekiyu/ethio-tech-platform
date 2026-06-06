import Session from "../models/Session.js";
import SessionParticipant from "../models/SessionParticipant.js";
import { getSocketIO } from "./notificationHelper.js";
import { logger } from "../lib/logger.js";

export const MEETING_STATUSES = Object.freeze(["scheduled", "waiting_for_host", "active", "completed", "cancelled"]);

const SESSION_TO_MEETING = {
  scheduled: "scheduled",
  live: "active",
  paused: "active",
  ended: "completed",
  canceled: "cancelled",
  draft: "scheduled",
  registration_closed: "scheduled",
  rescheduled: "scheduled",
};

const derive = ({ status, scheduledAt, liveStartedAt, liveEndedAt, durationMinutes, hostJoined, now }) => {
  const ts = now instanceof Date ? now.getTime() : new Date(now ?? Date.now()).getTime();
  const startedAtMs = scheduledAt ? new Date(scheduledAt).getTime() : NaN;
  const endWindowMs = (durationMinutes ?? 60) * 60 * 1000;

  if (status === "canceled") return "cancelled";
  if (status === "ended") return "completed";

  if (status === "live" || status === "paused") return "active";

  if (Number.isFinite(startedAtMs) && ts >= startedAtMs + endWindowMs) {
    return "completed";
  }

  if (status === "scheduled" || status === "registration_closed" || status === "rescheduled" || status === "draft") {
    if (Number.isFinite(startedAtMs) && ts >= startedAtMs) {
      if (hostJoined) return "active";
      return "waiting_for_host";
    }
    return "scheduled";
  }

  if (Number.isFinite(startedAtMs)) {
    if (liveStartedAt && hostJoined && (!liveEndedAt || ts < new Date(liveEndedAt).getTime())) {
      return "active";
    }
    if (hostJoined) return "active";
  }

  return SESSION_TO_MEETING[status] ?? "scheduled";
};

export const deriveMeetingStatus = ({ session, hostJoined = false, now } = {}) => {
  if (!session) return "scheduled";
  return derive({
    status: session.status,
    scheduledAt: session.scheduledAt,
    liveStartedAt: session.liveStartedAt,
    liveEndedAt: session.liveEndedAt,
    durationMinutes: session.durationMinutes,
    hostJoined,
    now,
  });
};

export const getMeetingJoinable = ({ session, status, viewer }) => {
  if (!session || !viewer) return false;
  if (viewer.role === "admin" || viewer.role === "super_admin") return true;
  if (status === "cancelled" || status === "completed") return false;
  const isMentor = String(safeId(session.mentor)) === String(viewer._id ?? viewer.id);
  if (isMentor) return true;
  const participants = (session.participants ?? []).map((p) => String(safeId(p)));
  if (participants.includes(String(viewer._id ?? viewer.id))) return true;
  return false;
};

export const canUserAccessMeeting = async (user, session) => {
  if (!user || !session) return false;
  if (user.role === "admin" || user.role === "super_admin") return true;
  const userId = String(user._id ?? user.id);
  const mentorId = safeId(session.mentor);
  if (mentorId && mentorId === userId) return true;
  const participants = (session.participants ?? []).map((p) => String(safeId(p)));
  if (participants.includes(userId)) return true;
  const participant = await SessionParticipant.findOne({
    session: session._id,
    user: user._id,
  }).select("_id");
  return Boolean(participant);
};

const safeId = (value) => {
  if (!value) return null;
  if (typeof value === "string") return value;
  if (value._id) return String(value._id);
  return String(value);
};

const safeName = (value, fallback) => {
  if (!value) return fallback;
  if (typeof value === "string") return value;
  return value.fullName || value.name || fallback;
};

const safeAvatar = (value) => {
  if (!value || typeof value === "string") return value ?? null;
  return value.avatar || value.avatarUrl || null;
};

const computeStartsInMs = (scheduledAt, now) => {
  if (!scheduledAt) return null;
  const ts = now instanceof Date ? now.getTime() : new Date(now ?? Date.now()).getTime();
  return Math.max(0, new Date(scheduledAt).getTime() - ts);
};

const computeEndsAt = (session) => {
  if (session.liveEndedAt) return new Date(session.liveEndedAt).toISOString();
  if (session.liveStartedAt) {
    return new Date(
      new Date(session.liveStartedAt).getTime() + (session.durationMinutes ?? 60) * 60 * 1000,
    ).toISOString();
  }
  if (session.scheduledAt) {
    return new Date(
      new Date(session.scheduledAt).getTime() + (session.durationMinutes ?? 60) * 60 * 1000,
    ).toISOString();
  }
  return null;
};

export const toMeetingViewModel = (session, { hostJoined = false, presenceCount = 0, viewer = null, now } = {}) => {
  if (!session) return null;
  const status = deriveMeetingStatus({ session, hostJoined, now });
  const mentorId = safeId(session.mentor);
  const participantIds = (session.participants ?? []).map((p) => String(safeId(p))).filter(Boolean);
  const viewerId = viewer ? String(viewer._id ?? viewer.id) : null;
  const isHost = viewerId ? mentorId === viewerId : false;
  const isAdmin = viewer ? viewer.role === "admin" || viewer.role === "super_admin" : false;
  const isParticipant = viewerId ? participantIds.includes(viewerId) : false;
  const joinable = getMeetingJoinable({ session, status, viewer, hostJoined });

  return {
    id: String(session._id),
    title: session.title,
    mentorId,
    mentorName: safeName(session.mentor, "Mentor"),
    mentorAvatar: safeAvatar(session.mentor),
    studentId: participantIds[0] ?? null,
    studentName: safeName(session.participants?.[0], "Student"),
    participantIds,
    sessionId: String(session._id),
    scheduledAt: session.scheduledAt,
    durationMinutes: session.durationMinutes ?? 60,
    status,
    hostJoined: Boolean(hostJoined),
    presenceCount,
    startsInMs: computeStartsInMs(session.scheduledAt, now),
    endsAt: computeEndsAt(session),
    liveRoomId: session.liveRoomId ?? null,
    classroomMode: session.classroomMode ?? "immersive-3d",
    liveProvider: session.liveProvider ?? "jitsi",
    joinable,
    isHost,
    isAdmin,
    isParticipant,
    joinHref: `/app/classroom/${String(session._id)}`,
    cancelReason: session.cancelReason ?? null,
    rescheduledFrom: session.rescheduledFrom ?? null,
    liveStartedAt: session.liveStartedAt ?? null,
    liveEndedAt: session.liveEndedAt ?? null,
  };
};

export const emitMeetingStatus = (io, session, extra = {}) => {
  if (!io || !session) return;
  const socket = io;
  const sessionId = String(session._id);
  const roomId = `session-${sessionId}`;
  const hostJoined = Boolean(extra.hostJoined);
  const presenceCount = Number(extra.presenceCount ?? 0);
  const now = extra.now ?? new Date();
  const view = toMeetingViewModel(session, { hostJoined, presenceCount, now });
  if (!view) return;
  const payload = {
    sessionId,
    status: view.status,
    hostJoined: view.hostJoined,
    presenceCount: view.presenceCount,
    startsInMs: view.startsInMs,
    endsAt: view.endsAt,
    title: view.title,
    scheduledAt: view.scheduledAt,
    at: now instanceof Date ? now.toISOString() : new Date(now).toISOString(),
  };
  try {
    socket.to(roomId).emit("meeting:status-changed", payload);
    socket.to(roomId).emit("meeting:status-changed", payload);
    const participants = (session.participants ?? []).map((p) => safeId(p)).filter(Boolean);
    const mentorId = safeId(session.mentor);
    const targets = new Set([mentorId, ...participants].filter(Boolean));
    for (const target of targets) {
      socket.to(`user:${target}`).emit("meeting:status-changed", payload);
    }
  } catch (err) {
    logger.warn("Failed to emit meeting:status-changed", { sessionId, error: err?.message });
  }
  return payload;
};

export const emitMeetingPresence = (io, session, { userId, role, joined }) => {
  if (!io || !session) return;
  const sessionId = String(session._id);
  const roomId = `session-${sessionId}`;
  const payload = {
    sessionId,
    userId: userId ? String(userId) : null,
    role: role ?? "participant",
    joined: Boolean(joined),
    at: new Date().toISOString(),
  };
  try {
    io.to(roomId).emit("meeting:presence", payload);
  } catch (err) {
    logger.warn("Failed to emit meeting:presence", { sessionId, error: err?.message });
  }
  return payload;
};

export const getRoomHostPresence = async (sessionId) => {
  const session = await Session.findById(sessionId).select("mentor");
  if (!session) return false;
  const io = getSocketIO();
  if (!io) return false;
  const roomId = `session-${sessionId}`;
  const sockets = await io
    .in(roomId)
    .fetchSockets()
    .catch(() => []);
  const mentorId = String(session.mentor);
  return sockets.some((s) => {
    const u = s.data?.user;
    return u && String(u.id) === mentorId;
  });
};

export const getRoomPresenceCount = async (sessionId) => {
  const io = getSocketIO();
  if (!io) return 0;
  const roomId = `session-${sessionId}`;
  const sockets = await io
    .in(roomId)
    .fetchSockets()
    .catch(() => []);
  return sockets.length;
};

export { derive as _derive };
