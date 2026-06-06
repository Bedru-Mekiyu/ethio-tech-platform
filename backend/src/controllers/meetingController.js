import Session from "../models/Session.js";
import SessionParticipant from "../models/SessionParticipant.js";
import SessionAuditLog from "../models/SessionAuditLog.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { sendResponse } from "../utils/apiResponse.js";
import {
  canUserAccessMeeting,
  deriveMeetingStatus,
  getRoomHostPresence,
  getRoomPresenceCount,
  toMeetingViewModel,
} from "../services/meetingService.js";
import sessionLock from "../services/sessionLockService.js";
import { getPagination } from "../utils/pagination.js";

const ensureLiveRoomId = async (session) => {
  if (!session.liveRoomId) {
    const { buildLiveRoomId } = await import("../services/liveClassroomService.js");
    session.liveRoomId = buildLiveRoomId(session._id);
    await session.save();
  }
  return session;
};

export const getMeetingStatus = asyncHandler(async (req, res) => {
  const session = await Session.findById(req.params.id);
  if (!session) throw new ApiError(404, "Session not found");

  const allowed = await canUserAccessMeeting(req.user, session);
  if (!allowed) throw new ApiError(403, "You do not have access to this meeting");

  const hostJoined = await getRoomHostPresence(session._id);
  const presenceCount = await getRoomPresenceCount(session._id);
  const view = toMeetingViewModel(session, { hostJoined, presenceCount, viewer: req.user });

  sendResponse(res, 200, "Meeting status fetched", {
    meeting: view,
    sessionId: String(session._id),
    status: view.status,
    hostJoined: view.hostJoined,
    presenceCount: view.presenceCount,
    joinable: view.joinable,
    startsInMs: view.startsInMs,
    endsAt: view.endsAt,
  });
});

export const getMyMeetings = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const { status, scope = "upcoming" } = req.query;
  const userId = req.user._id;
  const now = new Date();

  const filter = { $or: [{ mentor: userId }, { participants: userId }] };

  if (status && status !== "all") {
    if (status === "active") {
      filter.status = "live";
    } else if (status === "completed") {
      filter.status = "ended";
    } else if (status === "cancelled") {
      filter.status = "canceled";
    } else if (status === "scheduled") {
      filter.status = { $in: ["scheduled", "registration_closed", "rescheduled"] };
    } else {
      filter.status = status;
    }
  } else if (scope === "upcoming") {
    filter.status = { $in: ["scheduled", "live", "paused", "registration_closed", "rescheduled"] };
    filter.scheduledAt = { $gte: new Date(now.getTime() - 6 * 60 * 60 * 1000) };
  } else if (scope === "past") {
    filter.$or = [
      { mentor: userId, status: { $in: ["ended", "canceled"] } },
      { participants: userId, status: { $in: ["ended", "canceled"] } },
    ];
  }

  const [sessions, total] = await Promise.all([
    Session.find(filter)
      .sort({ scheduledAt: scope === "past" ? -1 : 1 })
      .skip(skip)
      .limit(limit)
      .populate("mentor", "fullName avatar role")
      .populate("participants", "fullName avatar role level"),
    Session.countDocuments(filter),
  ]);

  const meetings = await Promise.all(
    sessions.map(async (session) => {
      const hostJoined = await getRoomHostPresence(session._id);
      const presenceCount = await getRoomPresenceCount(session._id);
      return toMeetingViewModel(session, { hostJoined, presenceCount, viewer: req.user });
    }),
  );

  sendResponse(res, 200, "Meetings fetched", {
    meetings,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

export const getAdminMeetings = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const { status, q } = req.query;
  const filter = {};
  if (status && status !== "all") {
    if (status === "active") {
      filter.status = "live";
    } else if (status === "completed") {
      filter.status = "ended";
    } else if (status === "cancelled") {
      filter.status = "canceled";
    } else if (status === "scheduled") {
      filter.status = { $in: ["scheduled", "registration_closed", "rescheduled"] };
    } else {
      filter.status = status;
    }
  }
  if (q) {
    filter.$or = [{ title: { $regex: q, $options: "i" } }];
  }

  const [sessions, total] = await Promise.all([
    Session.find(filter)
      .sort({ scheduledAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("mentor", "fullName avatar role email")
      .populate("participants", "fullName avatar role"),
    Session.countDocuments(filter),
  ]);

  const meetings = await Promise.all(
    sessions.map(async (session) => {
      const hostJoined = await getRoomHostPresence(session._id);
      const presenceCount = await getRoomPresenceCount(session._id);

      const participantDocs = await SessionParticipant.find({ session: session._id }).select(
        "user status joinedAt leftAt totalPresenceMs verifiedAttendance",
      );
      const totalParticipants = participantDocs.length;
      const joinedCount = participantDocs.filter((p) => ["joined", "active", "completed"].includes(p.status)).length;
      const verifiedCount = participantDocs.filter((p) => p.verifiedAttendance).length;
      const totalPresenceMs = participantDocs.reduce((sum, p) => sum + (p.totalPresenceMs || 0), 0);

      return {
        ...toMeetingViewModel(session, { hostJoined, presenceCount }),
        attendance: {
          totalParticipants,
          joinedCount,
          verifiedCount,
          totalPresenceMs,
        },
        logs: await SessionAuditLog.find({ session: session._id })
          .sort({ createdAt: -1 })
          .limit(10)
          .populate("actor", "fullName role"),
      };
    }),
  );

  sendResponse(res, 200, "Admin meetings fetched", {
    meetings,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

export const forceEndMeeting = asyncHandler(async (req, res) => {
  const session = await Session.findById(req.params.id);
  if (!session) throw new ApiError(404, "Session not found");

  if (["ended", "canceled"].includes(session.status)) {
    throw new ApiError(400, "Session is already ended or canceled");
  }

  if (!sessionLock.acquire(session._id)) {
    throw new ApiError(409, "Session is being updated by another request");
  }

  try {
    const previousStatus = session.status;
    session.liveEndedAt = new Date();
    session.cancelReason = req.body?.reason || "Force-ended by administrator";
    session.transitionTo("ended");
    await session.save();

    await SessionAuditLog.create({
      session: session._id,
      action: "ended",
      actor: req.user._id,
      metadata: { reason: "admin_force_end", previousStatus, adminReason: session.cancelReason },
      ip: req.ip,
    });

    const { emitMeetingStatus } = await import("../services/meetingService.js");
    const { getSocketIO } = await import("../services/notificationHelper.js");
    const io = getSocketIO();
    if (io) emitMeetingStatus(io, session);

    if (session.participants.length) {
      const Notification = (await import("../models/Notification.js")).default;
      await Notification.insertMany(
        session.participants.map((participantId) => ({
          recipient: participantId,
          type: "session",
          message: `Meeting ended by administrator: ${session.title}`,
          link: `/app/dashboard`,
          createdBy: req.user._id,
        })),
      );
    }

    sendResponse(res, 200, "Meeting force-ended by administrator", { session });
  } finally {
    sessionLock.release(session._id);
  }
});

export const getMeetingAttendance = asyncHandler(async (req, res) => {
  const session = await Session.findById(req.params.id).select("mentor title scheduledAt");
  if (!session) throw new ApiError(404, "Session not found");

  const isMentor = String(session.mentor) === String(req.user._id);
  const isAdmin = req.user.role === "admin" || req.user.role === "super_admin";
  if (!isMentor && !isAdmin) {
    throw new ApiError(403, "Only the meeting host or admin can view attendance");
  }

  const participants = await SessionParticipant.find({ session: session._id })
    .populate("user", "fullName email avatar role")
    .sort({ joinedAt: -1 });

  const summary = participants.reduce(
    (acc, p) => {
      acc.total += 1;
      if (["joined", "active", "completed"].includes(p.status)) acc.joined += 1;
      if (p.verifiedAttendance) acc.verified += 1;
      acc.totalPresenceMs += p.totalPresenceMs || 0;
      return acc;
    },
    { total: 0, joined: 0, verified: 0, totalPresenceMs: 0 },
  );

  sendResponse(res, 200, "Meeting attendance fetched", {
    sessionId: String(session._id),
    title: session.title,
    scheduledAt: session.scheduledAt,
    status: deriveMeetingStatus({ session }),
    summary,
    participants,
  });
});

export { ensureLiveRoomId };
