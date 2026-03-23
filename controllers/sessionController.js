import Session from "../models/Session.js";
import SessionFeedback from "../models/SessionFeedback.js";
import Notification from "../models/Notification.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { sendResponse } from "../utils/apiResponse.js";
import { grantXPWithOptions } from "../services/xpService.js";
import { buildLiveRoomId, generateLiveAccessToken } from "../services/liveClassroomService.js";
import { recomputeMentorContribution } from "../services/mentorScoreService.js";

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

  sendResponse(res, 201, "Session created", { session });
});

export const getSessions = asyncHandler(async (req, res) => {
  const { status, mentor } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (mentor) filter.mentor = mentor;

  const sessions = await Session.find(filter)
    .sort({ scheduledAt: 1 })
    .populate("mentor", "fullName")
    .populate("participants", "fullName role");

  sendResponse(res, 200, "Sessions fetched", { sessions });
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

  Object.assign(session, req.body);
  await session.save();
  sendResponse(res, 200, "Session updated", { session });
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

  session.participants.push(req.user._id);
  await session.save();

  await session.populate("participants", "fullName");

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

  if (!session.liveRoomId) {
    session.liveRoomId = buildLiveRoomId(session._id);
  }

  session.status = "live";
  session.liveStartedAt = new Date();
  await session.save();

  if (session.participants.length) {
    await Notification.insertMany(
      session.participants.map((participantId) => ({
        recipient: participantId,
        type: "session",
        message: `Session is now live: ${session.title}`,
        link: `/sessions/${session._id}`,
        createdBy: req.user._id,
      }))
    );
  }

  sendResponse(res, 200, "Session started", { session });
});

export const getLiveSessionAccess = asyncHandler(async (req, res) => {
    if (!["scheduled", "live"].includes(session.status)) {
      throw new ApiError(400, "Live access is available only for scheduled or live sessions");
    }

  const session = await Session.findById(req.params.id);
  if (!session) throw new ApiError(404, "Session not found");

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
  });
});

export const leaveSession = asyncHandler(async (req, res) => {
  const session = await Session.findByIdAndUpdate(
    req.params.id,
    { $pull: { participants: req.user._id } },
    { new: true }
  ).populate("participants", "fullName");

  if (!session) throw new ApiError(404, "Session not found");
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

  session.status = "ended";
  session.liveEndedAt = new Date();
  await session.save();

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

  await recomputeMentorContribution(session.mentor);

  if (session.participants.length) {
    await Notification.insertMany(
      session.participants.map((participantId) => ({
        recipient: participantId,
        type: "session",
        message: `Session ended: ${session.title}. XP has been processed.`,
        link: `/sessions/${session._id}`,
        createdBy: req.user._id,
      }))
    );
  }

  sendResponse(res, 200, "Session ended and attendance XP awarded", { session });
});

export const submitSessionFeedback = asyncHandler(async (req, res) => {
    if (session.status !== "ended") {
      throw new ApiError(400, "Feedback can only be submitted after session ends");
    }

  const { quality, engagement, impact, comment } = req.body;
  const session = await Session.findById(req.params.id);
  if (!session) throw new ApiError(404, "Session not found");

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
    { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
  );

  const mentorContribution = await recomputeMentorContribution(session.mentor);

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
    SessionFeedback.find({ session: session._id })
      .sort({ createdAt: -1 })
      .populate("student", "fullName"),
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
