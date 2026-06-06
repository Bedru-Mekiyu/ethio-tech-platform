import mongoose from "mongoose";
import Session from "../models/Session.js";
import SessionFeedback from "../models/SessionFeedback.js";
import SessionParticipant from "../models/SessionParticipant.js";
import SessionAuditLog from "../models/SessionAuditLog.js";
import Notification from "../models/Notification.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { sendResponse } from "../utils/apiResponse.js";
import { getEnv } from "../config/env.js";
import { grantXPWithOptions } from "../services/xpService.js";
import { batchVerifySession, grantXpToVerified } from "../services/attendanceService.js";
import { buildLiveRoomId, generateLiveAccessToken } from "../services/liveClassroomService.js";
import { recomputeMentorContribution } from "../services/mentorScoreService.js";
import {
  createInvitation,
  acceptInvitation,
  declineInvitation,
  getInvitationsForUser,
} from "../services/invitationService.js";
import {
  joinWaitlist,
  cancelWaitlist,
  promoteNext,
  getWaitlistStatus,
  getWaitlistCount,
} from "../services/waitlistService.js";
import { addToWaitingRoom, admitUser, denyUser, getWaitingQueue } from "../services/admissionService.js";
import sessionLock from "../services/sessionLockService.js";
import { notifyUser, notifyManyUsers } from "../services/notificationService.js";
import { scheduleReminders, cancelReminders } from "../services/reminderService.js";
import {
  emitMeetingStatus,
  emitMeetingPresence,
  getRoomHostPresence,
  getRoomPresenceCount,
} from "../services/meetingService.js";
import { getSocketIO } from "../services/notificationHelper.js";

export const createSession = asyncHandler(async (req, res) => {
  if (new Date(req.body.scheduledAt) <= new Date()) {
    throw new ApiError(400, "scheduledAt must be in the future");
  }

  const session = await Session.create({
    ...req.body,
    mentor: req.user._id,
  });

  if (!session.liveRoomId) {
    session.liveRoomId = buildLiveRoomId(session._id);
    await session.save();
  }

  scheduleReminders(session._id).catch(() => undefined);

  const io = getSocketIO();
  if (io) emitMeetingStatus(io, session);

  if (session.participants?.length) {
    await notifyManyUsers({
      recipientIds: session.participants,
      type: "session",
      message: `Meeting scheduled: ${session.title}`,
      link: `/app/classroom/${session._id}`,
      createdBy: req.user._id,
    }).catch(() => undefined);
  }

  sendResponse(res, 201, "Session created", { session });
});

export const getSessions = asyncHandler(async (req, res) => {
  const { status, mentor, q, dateFrom, dateTo, tags, page = "1", limit = "20" } = req.query;
  const filter = {};
  if (status) filter.status = status;

  if (req.user.role === "admin") {
    if (mentor) filter.mentor = mentor;
  } else if (req.user.role === "mentor") {
    filter.mentor = req.user._id;
  } else {
    filter.$or = [{ participants: req.user._id }, { mentor: req.user._id }];
  }

  if (q) {
    filter.$text = { $search: q };
  }
  if (dateFrom || dateTo) {
    filter.scheduledAt = {};
    if (dateFrom) filter.scheduledAt.$gte = new Date(dateFrom);
    if (dateTo) filter.scheduledAt.$lte = new Date(dateTo);
  }
  if (tags) {
    filter.tags = { $in: Array.isArray(tags) ? tags : [tags] };
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (pageNum - 1) * limitNum;

  const [sessions, total] = await Promise.all([
    Session.find(filter)
      .sort({ scheduledAt: 1 })
      .skip(skip)
      .limit(limitNum)
      .populate("mentor", "fullName")
      .populate("participants", "fullName role"),
    Session.countDocuments(filter),
  ]);

  sendResponse(res, 200, "Sessions fetched", {
    sessions,
    pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
  });
});

export const getSessionById = asyncHandler(async (req, res) => {
  const session = await Session.findById(req.params.id)
    .populate("mentor", "fullName avatar role mentorScore totalSessions")
    .populate("participants", "fullName avatar role level");

  if (!session) throw new ApiError(404, "Session not found");

  const isMentor = String(session.mentor?._id ?? session.mentor) === String(req.user._id);
  const isParticipant = session.participants.some((participant) => String(participant._id) === String(req.user._id));
  const isAdmin = req.user.role === "admin";

  if (!isMentor && !isParticipant && !isAdmin) {
    throw new ApiError(403, "Only mentor, participants, or admin can access session details");
  }

  sendResponse(res, 200, "Session fetched", { session });
});

export const updateSession = asyncHandler(async (req, res) => {
  const session = await Session.findById(req.params.id);
  if (!session) throw new ApiError(404, "Session not found");

  if (String(session.mentor) !== String(req.user._id) && req.user.role !== "admin") {
    throw new ApiError(403, "Only assigned mentor/admin can update session");
  }

  if (req.body.scheduledAt && new Date(req.body.scheduledAt) <= new Date()) {
    throw new ApiError(400, "scheduledAt must be in the future");
  }

  if (["ended", "canceled"].includes(session.status)) {
    throw new ApiError(400, "Ended or canceled sessions cannot be updated");
  }

  if (req.body.status) {
    throw new ApiError(
      400,
      "Use dedicated status endpoints (start/end/pause/resume/cancel/reschedule) instead of update",
    );
  }

  const needsLock = req.body.scheduledAt;
  if (needsLock && !sessionLock.acquire(session._id)) {
    throw new ApiError(409, "Session is being updated by another request");
  }

  try {
    const allowedFields = [
      "title",
      "scheduledAt",
      "durationMinutes",
      "classroomMode",
      "liveProvider",
      "meetingLink",
      "recordingUrl",
      "xpPerAttendee",
      "whiteboardEnabled",
      "codeCollabEnabled",
    ];
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        session[field] = req.body[field];
      }
    }
    await session.save();

    if (session.participants.length) {
      await notifyManyUsers({
        recipientIds: session.participants,
        type: "session",
        message: `Session updated: ${session.title}`,
        link: `/sessions/${session._id}`,
        createdBy: req.user._id,
      });
    }

    sendResponse(res, 200, "Session updated", { session });
  } finally {
    if (needsLock) sessionLock.release(session._id);
  }
});

export const cancelSession = asyncHandler(async (req, res) => {
  const session = await Session.findById(req.params.id);
  if (!session) throw new ApiError(404, "Session not found");

  if (String(session.mentor) !== String(req.user._id) && req.user.role !== "admin") {
    throw new ApiError(403, "Only assigned mentor/admin can cancel session");
  }

  if (["ended", "canceled"].includes(session.status)) {
    throw new ApiError(400, "Session is already ended or canceled");
  }

  session.cancelReason = req.body.reason;
  session.transitionTo("canceled");
  await session.save();

  await SessionAuditLog.create({
    session: session._id,
    action: "cancelled",
    actor: req.user._id,
    metadata: { reason: req.body.reason, previousStatus: session.status },
    ip: req.ip,
  });

  cancelReminders(session._id).catch(() => undefined);

  const io = getSocketIO();
  if (io) emitMeetingStatus(io, session);

  if (session.participants.length) {
    await notifyManyUsers({
      recipientIds: session.participants,
      type: "session",
      message: `Meeting cancelled: ${session.title}${req.body.reason ? `. Reason: ${req.body.reason}` : ""}`,
      link: `/app/dashboard`,
      createdBy: req.user._id,
    });
  }

  sendResponse(res, 200, "Session canceled", { session });
});

export const joinSession = asyncHandler(async (req, res) => {
  const session = await Session.findById(req.params.id);
  if (!session) throw new ApiError(404, "Session not found");

  if (["ended", "canceled"].includes(session.status)) {
    throw new ApiError(400, "Cannot join ended or canceled sessions");
  }

  const alreadyJoined = session.participants.map(String).includes(String(req.user._id));
  if (alreadyJoined) {
    return sendResponse(res, 200, "Already joined session", { session });
  }

  if (!session.isPublic && req.user.role === "student" && session.track) {
    try {
      const User = mongoose.model("User");
      const user = await User.findById(req.user._id).select("enrolledTracks").lean();
      const isEnrolled = user?.enrolledTracks?.some((t) => String(t) === String(session.track));
      if (!isEnrolled) {
        throw new ApiError(403, "You are not enrolled in the required track for this session");
      }
    } catch (err) {
      if (err instanceof ApiError) throw err;
    }
  }

  if (session.admissionMode === "waiting-room") {
    try {
      await addToWaitingRoom({
        sessionId: session._id,
        userId: req.user._id,
        ip: req.ip,
      });
      return sendResponse(res, 200, "Added to waiting room. Waiting for host to admit you.", {
        waitingRoom: true,
        sessionId: session._id,
      });
    } catch (err) {
      throw new ApiError(400, err.message);
    }
  }

  if (session.maxParticipants > 0 && session.participants.length >= session.maxParticipants) {
    throw new ApiError(400, "Session is at full capacity");
  }

  session.participants.push(req.user._id);
  await session.save();

  await SessionParticipant.findOneAndUpdate(
    { session: session._id, user: req.user._id },
    {
      session: session._id,
      user: req.user._id,
      status: "registered",
      role: String(session.mentor) === String(req.user._id) ? "host" : "participant",
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  await SessionAuditLog.create({
    session: session._id,
    action: "user_joined",
    actor: req.user._id,
    targetUser: req.user._id,
    ip: req.ip,
  });

  await notifyUser({
    recipientId: session.mentor,
    type: "session",
    message: `A new participant joined your session: ${session.title}`,
    link: `/sessions/${session._id}`,
    createdBy: req.user._id,
  });

  await session.populate("participants", "fullName");

  const io = getSocketIO();
  if (io) {
    const hostJoined = await getRoomHostPresence(session._id);
    const presenceCount = await getRoomPresenceCount(session._id);
    emitMeetingStatus(io, session, { hostJoined, presenceCount });
    emitMeetingPresence(io, session, {
      userId: req.user._id,
      role: String(session.mentor) === String(req.user._id) ? "host" : "participant",
      joined: true,
    });
  }

  sendResponse(res, 200, "Joined session", { session });
});

export const startSession = asyncHandler(async (req, res) => {
  const session = await Session.findById(req.params.id);
  if (!session) throw new ApiError(404, "Session not found");

  if (String(session.mentor) !== String(req.user._id) && req.user.role !== "admin") {
    throw new ApiError(403, "Only assigned mentor/admin can start session");
  }

  if (session.status === "ended" || session.status === "canceled") {
    throw new ApiError(400, "Cannot start ended or canceled sessions");
  }

  if (session.status === "live") {
    return sendResponse(res, 200, "Session already live", { session });
  }

  if (!sessionLock.acquire(session._id)) {
    throw new ApiError(409, "Session is being started by another request");
  }

  try {
    if (!session.liveRoomId) {
      session.liveRoomId = buildLiveRoomId(session._id);
    }

    session.liveStartedAt = new Date();
    session.transitionTo("live");
    await session.save();

    const io = getSocketIO();
    if (io) {
      const hostJoined = await getRoomHostPresence(session._id);
      const presenceCount = await getRoomPresenceCount(session._id);
      emitMeetingStatus(io, session, { hostJoined, presenceCount });
    }

    if (session.participants.length) {
      await Notification.insertMany(
        session.participants.map((participantId) => ({
          recipient: participantId,
          type: "session",
          message: `Your session has started. Click here to join: ${session.title}`,
          link: `/app/classroom/${session._id}`,
          createdBy: req.user._id,
        })),
      );
    }

    sendResponse(res, 200, "Session started", { session });
  } finally {
    sessionLock.release(session._id);
  }
});

export const getLiveSessionAccess = asyncHandler(async (req, res) => {
  const session = await Session.findById(req.params.id);
  if (!session) throw new ApiError(404, "Session not found");

  if (!["scheduled", "live"].includes(session.status)) {
    throw new ApiError(400, "Live access is available only for scheduled or live sessions");
  }

  const isMentor = String(session.mentor) === String(req.user._id);
  const isParticipant = session.participants.map(String).includes(String(req.user._id));
  const isAdmin = req.user.role === "admin";

  if (!isMentor && !isParticipant && !isAdmin) {
    throw new ApiError(403, "Only mentor, participants, or admin can access live classroom");
  }

  if (!session.liveRoomId) {
    session.liveRoomId = buildLiveRoomId(session._id);
    await session.save();
  }

  const accessToken = generateLiveAccessToken({
    sessionId: session._id,
    userId: req.user._id,
    role: req.user.role,
    roomId: session.liveRoomId,
  });

  sendResponse(res, 200, "Live classroom access granted", {
    sessionId: session._id,
    roomId: session.liveRoomId,
    provider: session.liveProvider,
    classroomMode: session.classroomMode,
    whiteboardEnabled: session.whiteboardEnabled,
    codeCollabEnabled: session.codeCollabEnabled,
    accessToken,
    screenShareActive: session.screenShareActive,
    screenShareUserId: session.screenShareUserId,
    recordingMode: session.recordingMode,
  });
});

export const leaveSession = asyncHandler(async (req, res) => {
  const session = await Session.findByIdAndUpdate(
    req.params.id,
    { $pull: { participants: req.user._id } },
    { new: true },
  ).populate("participants", "fullName");

  if (!session) throw new ApiError(404, "Session not found");

  await SessionParticipant.findOneAndUpdate(
    { session: session._id, user: req.user._id },
    { status: "completed", leftAt: new Date() },
    { upsert: false },
  );

  await SessionAuditLog.create({
    session: session._id,
    action: "user_left",
    actor: req.user._id,
    targetUser: req.user._id,
    ip: req.ip,
  });

  await notifyUser({
    recipientId: session.mentor,
    type: "session",
    message: `A participant left your session: ${session.title}`,
    link: `/sessions/${session._id}`,
    createdBy: req.user._id,
  });

  if (session.maxParticipants > 0) {
    const currentCount = session.participants.length;
    if (currentCount < session.maxParticipants) {
      promoteNext(session._id).catch(() => undefined);
    }
  }

  const io = getSocketIO();
  if (io) {
    const hostJoined = await getRoomHostPresence(req.params.id);
    const presenceCount = await getRoomPresenceCount(req.params.id);
    emitMeetingStatus(io, session, { hostJoined, presenceCount });
    emitMeetingPresence(io, session, {
      userId: req.user._id,
      role: String(session.mentor) === String(req.user._id) ? "host" : "participant",
      joined: false,
    });
  }

  sendResponse(res, 200, "Left session", { session });
});

export const endSession = asyncHandler(async (req, res) => {
  const session = await Session.findById(req.params.id);
  if (!session) throw new ApiError(404, "Session not found");

  if (String(session.mentor) !== String(req.user._id) && req.user.role !== "admin") {
    throw new ApiError(403, "Only assigned mentor/admin can end session");
  }

  if (session.status === "ended") {
    return sendResponse(res, 200, "Session already ended", { session });
  }

  if (session.status === "canceled") {
    throw new ApiError(400, "Cannot end a canceled session");
  }

  if (!sessionLock.acquire(session._id)) {
    throw new ApiError(409, "Session is being ended by another request");
  }

  try {
    session.liveEndedAt = new Date();
    session.transitionTo("ended");
    await session.save();

    cancelReminders(session._id).catch(() => undefined);

    const env = getEnv();
    if (env.featureAttendanceVerification) {
      await batchVerifySession(session._id);
      await grantXpToVerified(session._id, session.xpPerAttendee, session.title);
    } else {
      for (const participantId of session.participants) {
        await grantXPWithOptions({
          userId: participantId,
          amount: session.xpPerAttendee || 0,
          reason: `Attended session: ${session.title}`,
          sourceType: "session",
          sourceId: session._id,
          enforceUniqueSource: true,
          allowExisting: true,
        });
      }
    }

    await recomputeMentorContribution(session.mentor);

    const io = getSocketIO();
    if (io) emitMeetingStatus(io, session);

    if (session.participants.length) {
      await Notification.insertMany(
        session.participants.map((participantId) => ({
          recipient: participantId,
          type: "session",
          message: `Session ended: ${session.title}. Leave feedback when you can.`,
          link: `/app/sessions/${session._id}/feedback`,
          createdBy: req.user._id,
        })),
      );
    }

    sendResponse(res, 200, "Session ended and attendance XP awarded", { session });
  } finally {
    sessionLock.release(session._id);
  }
});

export const pauseSession = asyncHandler(async (req, res) => {
  const session = await Session.findById(req.params.id);
  if (!session) throw new ApiError(404, "Session not found");
  if (session.status !== "live") throw new ApiError(400, "Only live sessions can be paused");
  session.transitionTo("paused");
  await session.save();
  sendResponse(res, 200, "Session paused", { session });
});

export const resumeSession = asyncHandler(async (req, res) => {
  const session = await Session.findById(req.params.id);
  if (!session) throw new ApiError(404, "Session not found");
  if (session.status !== "paused") throw new ApiError(400, "Only paused sessions can be resumed");
  session.transitionTo("live");
  await session.save();
  sendResponse(res, 200, "Session resumed", { session });
});

export const closeRegistration = asyncHandler(async (req, res) => {
  const session = await Session.findById(req.params.id);
  if (!session) throw new ApiError(404, "Session not found");
  if (!["scheduled"].includes(session.status))
    throw new ApiError(400, "Only scheduled sessions can close registration");
  session.transitionTo("registration_closed");
  await session.save();
  sendResponse(res, 200, "Registration closed", { session });
});

export const rescheduleSession = asyncHandler(async (req, res) => {
  const session = await Session.findById(req.params.id);
  if (!session) throw new ApiError(404, "Session not found");
  if (["ended", "canceled"].includes(session.status))
    throw new ApiError(400, "Cannot reschedule ended or canceled sessions");

  const { scheduledAt, reason } = req.body;
  session.rescheduledFrom = session.scheduledAt;
  session.rescheduledReason = reason;
  session.scheduledAt = new Date(scheduledAt);
  session.transitionTo("rescheduled");
  await session.save();

  await SessionAuditLog.create({
    session: session._id,
    action: "rescheduled",
    actor: req.user._id,
    metadata: { from: session.rescheduledFrom, to: session.scheduledAt, reason },
    ip: req.ip,
  });

  if (session.participants.length) {
    await notifyManyUsers({
      recipientIds: session.participants,
      type: "session",
      message: `Session rescheduled: ${session.title}. New date: ${new Date(session.scheduledAt).toLocaleString()}`,
      link: `/sessions/${session._id}`,
      createdBy: req.user._id,
    });
  }

  sendResponse(res, 200, "Session rescheduled", { session });
});

export const setParticipantRole = asyncHandler(async (req, res) => {
  const { userId, role } = req.body;
  const session = await Session.findById(req.params.id);
  if (!session) throw new ApiError(404, "Session not found");

  const actor = await SessionParticipant.findOne({ session: session._id, user: req.user._id }).select("role");
  const actorRole = String(session.mentor) === String(req.user._id) ? "host" : (actor?.role ?? "participant");

  const validRoles = ["cohost", "moderator", "participant", "observer"];

  if (!validRoles.includes(role)) {
    throw new ApiError(400, `Invalid role. Must be one of: ${validRoles.join(", ")}`);
  }

  if (role === "cohost" && actorRole !== "host") {
    throw new ApiError(403, "Only the host can assign cohost");
  }

  if (role === "moderator" && !["host", "cohost"].includes(actorRole)) {
    throw new ApiError(403, "Only host or cohost can assign moderator");
  }

  const target = await SessionParticipant.findOne({ session: session._id, user: userId });
  if (!target) throw new ApiError(404, "User is not a participant in this session");

  if (target.role === "host") {
    throw new ApiError(400, "Cannot change the host's role");
  }

  target.role = role;
  await target.save();

  sendResponse(res, 200, "Participant role updated", { participant: target });
});

export const joinSessionWaitlist = asyncHandler(async (req, res) => {
  const session = await Session.findById(req.params.id).select("maxParticipants status");
  if (!session) throw new ApiError(404, "Session not found");

  if (["ended", "canceled"].includes(session.status)) {
    throw new ApiError(400, "Cannot join waitlist for ended or canceled sessions");
  }

  try {
    const entry = await joinWaitlist({
      sessionId: session._id,
      userId: req.user._id,
      ip: req.ip,
    });
    sendResponse(res, 200, "Joined waitlist", { position: entry.position });
  } catch (err) {
    throw new ApiError(400, err.message);
  }
});

export const cancelSessionWaitlist = asyncHandler(async (req, res) => {
  try {
    const entry = await cancelWaitlist({
      sessionId: req.params.id,
      userId: req.user._id,
      ip: req.ip,
    });
    sendResponse(res, 200, "Left waitlist", { position: entry.position });
  } catch (err) {
    throw new ApiError(400, err.message);
  }
});

export const joinSessionWaitingRoom = asyncHandler(async (req, res) => {
  try {
    const result = await addToWaitingRoom({
      sessionId: req.params.id,
      userId: req.user._id,
      ip: req.ip,
    });
    sendResponse(res, 200, "Added to waiting room", result);
  } catch (err) {
    throw new ApiError(400, err.message);
  }
});

export const admitFromWaitingRoom = asyncHandler(async (req, res) => {
  const { userId } = req.body;
  try {
    const participant = await admitUser({
      sessionId: req.params.id,
      userId,
      actorId: req.user._id,
      ip: req.ip,
    });
    sendResponse(res, 200, "User admitted", { participant });
  } catch (err) {
    throw new ApiError(400, err.message);
  }
});

export const denyFromWaitingRoom = asyncHandler(async (req, res) => {
  const { userId } = req.body;
  try {
    const participant = await denyUser({
      sessionId: req.params.id,
      userId,
      actorId: req.user._id,
      ip: req.ip,
    });
    sendResponse(res, 200, "User denied", { participant });
  } catch (err) {
    throw new ApiError(400, err.message);
  }
});

export const getWaitingQueueHandler = asyncHandler(async (req, res) => {
  const queue = await getWaitingQueue(req.params.id);
  sendResponse(res, 200, "Waiting queue", { queue });
});

export const inviteToSession = asyncHandler(async (req, res) => {
  const { inviteeId, method, message } = req.body;
  try {
    const invitation = await createInvitation({
      sessionId: req.params.id,
      inviterId: req.user._id,
      inviteeId,
      method: method || "direct",
      message,
      ip: req.ip,
    });
    sendResponse(res, 201, "Invitation sent", { invitation });
  } catch (err) {
    throw new ApiError(400, err.message);
  }
});

export const acceptSessionInvitation = asyncHandler(async (req, res) => {
  try {
    const invitation = await acceptInvitation({
      invitationId: req.params.id,
      userId: req.user._id,
      ip: req.ip,
    });
    sendResponse(res, 200, "Invitation accepted", { invitation });
  } catch (err) {
    throw new ApiError(400, err.message);
  }
});

export const declineSessionInvitation = asyncHandler(async (req, res) => {
  try {
    const invitation = await declineInvitation({
      invitationId: req.params.id,
      userId: req.user._id,
    });
    sendResponse(res, 200, "Invitation declined", { invitation });
  } catch (err) {
    throw new ApiError(400, err.message);
  }
});

export const getMyInvitations = asyncHandler(async (req, res) => {
  const invitations = await getInvitationsForUser(req.user._id);
  sendResponse(res, 200, "Invitations fetched", { invitations });
});

export const getMyWaitlistStatus = asyncHandler(async (req, res) => {
  const status = await getWaitlistStatus(req.params.id, req.user._id);
  sendResponse(res, 200, "Waitlist status", status);
});

export const getSessionAvailability = asyncHandler(async (req, res) => {
  const session = await Session.findById(req.params.id).select("maxParticipants participants");
  if (!session) throw new ApiError(404, "Session not found");

  const registeredCount = session.participants.length;
  const maxCapacity = session.maxParticipants || 0;
  const remainingSeats = maxCapacity > 0 ? Math.max(0, maxCapacity - registeredCount) : -1;

  const waitlistCount = await getWaitlistCount(session._id);

  sendResponse(res, 200, "Session availability", {
    registeredCount,
    maxCapacity,
    remainingSeats,
    waitlistCount,
    isFull: maxCapacity > 0 && registeredCount >= maxCapacity,
  });
});

export const getSessionPresence = asyncHandler(async (req, res) => {
  const session = await Session.findById(req.params.id);
  if (!session) throw new ApiError(404, "Session not found");

  const isMentor = String(session.mentor) === String(req.user._id);
  if (!isMentor && req.user.role !== "admin") {
    throw new ApiError(403, "Only mentor or admin can view presence");
  }

  const participants = await SessionParticipant.find({ session: session._id })
    .populate("user", "fullName avatar role")
    .sort({ status: 1, joinedAt: -1 });

  sendResponse(res, 200, "Session presence fetched", { participants });
});

export const getSessionPresenceSummary = asyncHandler(async (req, res) => {
  const session = await Session.findById(req.params.id);
  if (!session) throw new ApiError(404, "Session not found");

  const isMentor = String(session.mentor) === String(req.user._id);
  if (!isMentor && req.user.role !== "admin") {
    throw new ApiError(403, "Only mentor or admin can view presence summary");
  }

  const [stats] = await SessionParticipant.aggregate([
    { $match: { session: session._id } },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        verified: { $sum: { $cond: ["$verifiedAttendance", 1, 0] } },
        absent: { $sum: { $cond: [{ $eq: ["$status", "absent"] }, 1, 0] } },
        pending: { $sum: { $cond: [{ $eq: ["$verifiedAttendance", false] }, 1, 0] } },
        active: { $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] } },
        joined: { $sum: { $cond: [{ $eq: ["$status", "joined"] }, 1, 0] } },
      },
    },
  ]);

  sendResponse(res, 200, "Session presence summary", {
    summary: stats || { total: 0, verified: 0, absent: 0, pending: 0, active: 0, joined: 0 },
  });
});

export const submitSessionFeedback = asyncHandler(async (req, res) => {
  const session = await Session.findById(req.params.id);
  if (!session) throw new ApiError(404, "Session not found");

  if (session.status !== "ended") {
    throw new ApiError(400, "Feedback can only be submitted after session ends");
  }

  const { quality, engagement, impact, comment } = req.body;

  const hasAttended = session.participants.map(String).includes(String(req.user._id));
  if (!hasAttended) {
    throw new ApiError(403, "Only participants can submit session feedback");
  }

  const feedback = await SessionFeedback.findOneAndUpdate(
    { session: session._id, student: req.user._id },
    {
      session: session._id,
      mentor: session.mentor,
      student: req.user._id,
      quality,
      engagement,
      impact,
      comment,
    },
    { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true },
  );

  const mentorContribution = await recomputeMentorContribution(session.mentor);

  await notifyUser({
    recipientId: session.mentor,
    type: "session",
    message: `New feedback submitted for session: ${session.title}`,
    link: `/sessions/${session._id}`,
    createdBy: req.user._id,
  });

  sendResponse(res, 200, "Session feedback submitted", {
    feedback,
    mentorContribution,
  });
});

export const getSessionFeedbackSummary = asyncHandler(async (req, res) => {
  const session = await Session.findById(req.params.id);
  if (!session) throw new ApiError(404, "Session not found");

  const isMentor = String(session.mentor) === String(req.user._id);
  if (!isMentor && req.user.role !== "admin") {
    throw new ApiError(403, "Only assigned mentor/admin can view feedback summary");
  }

  const [summary, feedback] = await Promise.all([
    SessionFeedback.aggregate([
      { $match: { session: session._id } },
      {
        $group: {
          _id: null,
          avgQuality: { $avg: "$quality" },
          avgEngagement: { $avg: "$engagement" },
          avgImpact: { $avg: "$impact" },
          feedbackCount: { $sum: 1 },
        },
      },
    ]),
    SessionFeedback.find({ session: session._id }).sort({ createdAt: -1 }).populate("student", "fullName"),
  ]);

  sendResponse(res, 200, "Session feedback summary fetched", {
    summary: summary[0] || {
      avgQuality: 0,
      avgEngagement: 0,
      avgImpact: 0,
      feedbackCount: 0,
    },
    feedback,
  });
});
