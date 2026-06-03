import asyncHandler from "../utils/asyncHandler.js";
import { sendResponse } from "../utils/apiResponse.js";
import ApiError from "../utils/ApiError.js";
import * as recordingService from "../services/sessionRecordingService.js";

export const createRecording = asyncHandler(async (req, res) => {
  const { title, description, url, durationMinutes, fileSize } = req.body;
  if (!title?.trim() || !url?.trim()) throw new ApiError(400, "Title and URL are required");
  const recording = await recordingService.createRecording({
    sessionId: req.params.sessionId,
    userId: req.user._id,
    title, description, url, durationMinutes, fileSize,
  });
  sendResponse(res, 201, "Recording created", { recording });
});

export const updateRecording = asyncHandler(async (req, res) => {
  const recording = await recordingService.updateRecording({
    recordingId: req.params.recordingId,
    userId: req.user._id,
    updates: req.body,
  });
  sendResponse(res, 200, "Recording updated", { recording });
});

export const publishRecording = asyncHandler(async (req, res) => {
  const recording = await recordingService.publishRecording({ recordingId: req.params.recordingId });
  sendResponse(res, 200, "Recording published", { recording });
});

export const deleteRecording = asyncHandler(async (req, res) => {
  await recordingService.deleteRecording({ recordingId: req.params.recordingId, userId: req.user._id });
  sendResponse(res, 200, "Recording deleted");
});

export const getRecordings = asyncHandler(async (req, res) => {
  const { includeUnpublished } = req.query;
  const recordings = await recordingService.getSessionRecordings(req.params.sessionId, includeUnpublished === "true");
  sendResponse(res, 200, "Recordings fetched", { recordings });
});

export const recordProgress = asyncHandler(async (req, res) => {
  const progressPercent = req.body.progressPercent !== undefined ? req.body.progressPercent : req.body.watchedPercent;
  if (progressPercent === undefined) throw new ApiError(400, "progressPercent or watchedPercent is required");
  const recording = await recordingService.recordWatchProgress({
    recordingId: req.params.recordingId,
    userId: req.user._id,
    progressPercent,
  });
  sendResponse(res, 200, "Progress recorded", { recording });
});

export const getRecordingStats = asyncHandler(async (req, res) => {
  const stats = await recordingService.getRecordingStats(req.params.sessionId);
  sendResponse(res, 200, "Recording stats", stats);
});

export const getStudentRecordings = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  
  // Import models here to avoid circular dependency / dependency loading order issues if any
  const SessionParticipant = (await import("../models/SessionParticipant.js")).default;
  const SessionRecording = (await import("../models/SessionRecording.js")).default;

  // Find all sessions this student participated in
  const participants = await SessionParticipant.find({ user: userId }).select("session").lean();
  const sessionIds = participants.map((p) => p.session);

  if (sessionIds.length === 0) {
    return sendResponse(res, 200, "Recordings fetched", {
      recordings: [],
      totalRecordings: 0,
      completedCount: 0,
      totalWatchTimeMinutes: 0,
    });
  }

  // Find all published recordings for those sessions
  const recordings = await SessionRecording.find({
    session: { $in: sessionIds },
    isPublished: true,
  })
    .populate("session", "title scheduledAt")
    .sort({ createdAt: -1 })
    .lean();

  let completedCount = 0;
  let totalWatchTimeMinutes = 0;

  const formattedRecordings = recordings.map((rec) => {
    const wp = rec.watchProgress?.find((p) => String(p.user) === String(userId));
    const watchedPercent = wp ? wp.progressPercent : 0;
    const completed = wp ? wp.completed : false;

    if (completed) {
      completedCount += 1;
    }
    if (rec.durationMinutes) {
      totalWatchTimeMinutes += Math.round(rec.durationMinutes * (watchedPercent / 100));
    }

    return {
      _id: rec._id,
      session: rec.session ? {
        _id: rec.session._id,
        title: rec.session.title,
        scheduledAt: rec.session.scheduledAt,
      } : undefined,
      title: rec.title,
      description: rec.description,
      url: rec.url,
      durationMinutes: rec.durationMinutes,
      publishedAt: rec.createdAt,
      progress: {
        watchedPercent,
        lastWatchedAt: wp ? wp.lastWatchedAt : undefined,
        completed,
      },
    };
  });

  sendResponse(res, 200, "Recordings fetched", {
    recordings: formattedRecordings,
    totalRecordings: recordings.length,
    completedCount,
    totalWatchTimeMinutes,
  });
});
