import Session from "../models/Session.js";
import SessionParticipant from "../models/SessionParticipant.js";
import SessionFeedback from "../models/SessionFeedback.js";
import asyncHandler from "../utils/asyncHandler.js";
import { sendResponse } from "../utils/apiResponse.js";
import { getCached, setCache } from "../services/cacheService.js";

export const getSessionAnalytics = asyncHandler(async (req, res) => {
  const cacheKey = "analytics:sessions";
  const cached = getCached(cacheKey);
  if (cached) return sendResponse(res, 200, "Session analytics", cached);

  const [attendanceRate, completionRate, avgDuration, feedbackStats, repeatAttendance] = await Promise.all([
    SessionParticipant.aggregate([
      { $group: { _id: "$session", total: { $sum: 1 }, verified: { $sum: { $cond: ["$verifiedAttendance", 1, 0] } } } },
      { $group: { _id: null, avgRate: { $avg: { $cond: [{ $gt: ["$total", 0] }, { $divide: ["$verified", "$total"] }, 0] } } } },
    ]),
    Session.aggregate([
      { $group: { _id: null, total: { $sum: 1 }, completed: { $sum: { $cond: [{ $eq: ["$status", "ended"] }, 1, 0] } } } },
    ]),
    Session.aggregate([
      { $match: { liveStartedAt: { $ne: null }, liveEndedAt: { $ne: null } } },
      { $project: { durationMs: { $subtract: ["$liveEndedAt", "$liveStartedAt"] } } },
      { $group: { _id: null, avgDurationMs: { $avg: "$durationMs" } } },
    ]),
    SessionFeedback.aggregate([
      { $group: { _id: null, avgQuality: { $avg: "$quality" }, avgEngagement: { $avg: "$engagement" }, avgImpact: { $avg: "$impact" }, count: { $sum: 1 } } },
    ]),
    SessionParticipant.aggregate([
      { $group: { _id: "$user", sessionCount: { $sum: 1 } } },
      { $match: { sessionCount: { $gt: 1 } } },
      { $count: "repeatUsers" },
    ]),
  ]);

  const result = {
    attendanceRate: attendanceRate[0]?.avgRate ?? 0,
    completionRate: completionRate[0] ? completionRate[0].completed / Math.max(completionRate[0].total, 1) : 0,
    avgDurationMinutes: avgDuration[0] ? Math.round(avgDuration[0].avgDurationMs / 60000) : 0,
    avgFeedback: feedbackStats[0] ? { quality: feedbackStats[0].avgQuality, engagement: feedbackStats[0].avgEngagement, impact: feedbackStats[0].avgImpact, count: feedbackStats[0].count } : null,
    repeatAttendees: repeatAttendance[0]?.repeatUsers ?? 0,
  };

  setCache(cacheKey, result, 300_000);
  sendResponse(res, 200, "Session analytics", result);
});

export const getMentorRankings = asyncHandler(async (req, res) => {
  const cacheKey = "analytics:mentor-rankings";
  const cached = getCached(cacheKey);
  if (cached) return sendResponse(res, 200, "Mentor rankings", cached);

  const rankings = await SessionFeedback.aggregate([
    { $group: { _id: "$mentor", avgQuality: { $avg: "$quality" }, avgEngagement: { $avg: "$engagement" }, avgImpact: { $avg: "$impact" }, feedbackCount: { $sum: 1 } } },
    { $addFields: { avgScore: { $avg: ["$avgQuality", "$avgEngagement", "$avgImpact"] } } },
    { $sort: { avgScore: -1 } },
    { $limit: 20 },
    { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "mentor" } },
    { $unwind: "$mentor" },
    { $project: { _id: 1, avgScore: 1, feedbackCount: 1, "mentor.fullName": 1, "mentor.avatar": 1 } },
  ]);

  setCache(cacheKey, rankings, 300_000);
  sendResponse(res, 200, "Mentor rankings", rankings);
});
