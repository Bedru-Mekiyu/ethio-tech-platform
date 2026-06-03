import Session from "../models/Session.js";
import SessionParticipant from "../models/SessionParticipant.js";
import SessionFeedback from "../models/SessionFeedback.js";
import SessionQuestion from "../models/SessionQuestion.js";
import SessionPoll from "../models/SessionPoll.js";
import EngagementScore from "../models/EngagementScore.js";
import User from "../models/User.js";
import ChatMessage from "../models/ChatMessage.js";
import asyncHandler from "../utils/asyncHandler.js";
import { sendResponse } from "../utils/apiResponse.js";

const analyticsCache = new Map();
const CACHE_TTL_MS = 60 * 1000;

export const getMentorAnalytics = asyncHandler(async (req, res) => {
  const mentorId = req.user._id;

  const cacheKey = String(mentorId);
  const cached = analyticsCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return sendResponse(res, 200, "Mentor analytics fetched", cached.data);
  }

  const [allSessions, feedbackSummary, participants, engagementSummary] = await Promise.all([
    Session.find({ mentor: mentorId }).sort({ scheduledAt: -1 }).lean(),
    SessionFeedback.aggregate([
      { $match: { mentor: mentorId } },
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
    SessionParticipant.aggregate([
      { $lookup: { from: "sessions", localField: "session", foreignField: "_id", as: "session" } },
      { $unwind: "$session" },
      { $match: { "session.mentor": mentorId } },
      {
        $group: {
          _id: null,
          totalParticipants: { $sum: 1 },
          verifiedAttendance: { $sum: { $cond: ["$verifiedAttendance", 1, 0] } },
          totalPresenceMs: { $sum: "$totalPresenceMs" },
        },
      },
    ]),
    EngagementScore.aggregate([
      { $lookup: { from: "sessions", localField: "session", foreignField: "_id", as: "session" } },
      { $unwind: "$session" },
      { $match: { "session.mentor": mentorId } },
      {
        $group: {
          _id: null,
          avgScore: { $avg: "$score" },
          totalStudents: { $sum: 1 },
        },
      },
    ]),
  ]);

  const endedSessions = allSessions.filter((s) => s.status === "ended");
  const completedSessions = endedSessions.length;
  const totalSessions = allSessions.length;
  const completionRate = totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0;

  const activeLearners = allSessions.reduce((acc, s) => {
    if (s.participants) s.participants.forEach((p) => acc.add(String(p)));
    return acc;
  }, new Set()).size;

  const feedback = feedbackSummary[0] || { avgQuality: 0, avgEngagement: 0, avgImpact: 0, feedbackCount: 0 };
  const avgRating = Number(((feedback.avgQuality + feedback.avgEngagement + feedback.avgImpact) / 3 * 20).toFixed(1));
  const participantData = participants[0] || { totalParticipants: 0, verifiedAttendance: 0, totalPresenceMs: 0 };
  const attendanceRate = participantData.totalParticipants > 0
    ? Math.round((participantData.verifiedAttendance / participantData.totalParticipants) * 100)
    : 0;
  const engagement = engagementSummary[0] || { avgScore: 0, totalStudents: 0 };

  const sessionsByMonth = allSessions.reduce((acc, s) => {
    const month = s.scheduledAt ? new Date(s.scheduledAt).toISOString().slice(0, 7) : "unknown";
    acc[month] = (acc[month] || 0) + 1;
    return acc;
  }, {});

  const studentGrowth = allSessions
    .filter((s) => s.status === "ended")
    .sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt))
    .reduce((acc, s) => {
      const month = s.scheduledAt ? new Date(s.scheduledAt).toISOString().slice(0, 7) : "unknown";
      acc[month] = (acc[month] || 0) + (s.participants?.length || 0);
      return acc;
    }, {});

  const responseData = {
    analytics: {
      sessionsHosted: totalSessions,
      completedSessions,
      completionRate,
      attendanceRate,
      engagementRate: Math.round(engagement.avgScore),
      avgRating,
      activeLearners,
      totalFeedback: feedback.feedbackCount,
      studentGrowth,
      sessionsByMonth,
      totalParticipants: participantData.totalParticipants,
      verifiedAttendance: participantData.verifiedAttendance,
      avgEngagementScore: Number(engagement.avgScore?.toFixed(1) || 0),
    },
  };

  analyticsCache.set(cacheKey, { timestamp: Date.now(), data: responseData });

  sendResponse(res, 200, "Mentor analytics fetched", responseData);
});

export const getMentorSessionAnalytics = asyncHandler(async (req, res) => {
  const sessionId = req.params.sessionId;
  const session = await Session.findById(sessionId);
  if (!session) return sendResponse(res, 404, "Session not found");

  if (String(session.mentor) !== String(req.user._id) && req.user.role !== "admin") {
    return sendResponse(res, 403, "Access denied");
  }

  const [participants, questions, polls, engagementScores, feedback] = await Promise.all([
    SessionParticipant.find({ session: sessionId }).populate("user", "fullName avatar").lean(),
    SessionQuestion.find({ session: sessionId }),
    SessionPoll.find({ session: sessionId }),
    EngagementScore.find({ session: sessionId }).populate("student", "fullName avatar").sort({ score: -1 }),
    SessionFeedback.find({ session: sessionId }),
  ]);

  const participantCount = participants.length;
  const verifiedCount = participants.filter((p) => p.verifiedAttendance).length;
  const totalPresenceMs = participants.reduce((sum, p) => sum + (p.totalPresenceMs || 0), 0);
  const avgPresenceMs = participantCount > 0 ? totalPresenceMs / participantCount : 0;
  const engagementAvg = engagementScores.length > 0
    ? engagementScores.reduce((sum, e) => sum + e.score, 0) / engagementScores.length
    : 0;

  sendResponse(res, 200, "Session analytics", {
    session: {
      id: session._id,
      title: session.title,
      status: session.status,
      duration: session.durationMinutes,
      liveDuration: session.liveStartedAt && session.liveEndedAt
        ? Math.round((new Date(session.liveEndedAt) - new Date(session.liveStartedAt)) / 60000)
        : null,
      scheduledAt: session.scheduledAt,
    },
    participants: {
      total: participantCount,
      verified: verifiedCount,
      verifiedRate: participantCount > 0 ? Math.round((verifiedCount / participantCount) * 100) : 0,
      avgPresenceMinutes: Math.round(avgPresenceMs / 60000),
      list: participants.map((p) => ({
        user: p.user,
        status: p.status,
        role: p.role,
        totalPresenceMinutes: Math.round((p.totalPresenceMs || 0) / 60000),
        verifiedAttendance: p.verifiedAttendance,
      })),
    },
    questions: {
      total: questions.length,
      pending: questions.filter((q) => q.status === "pending").length,
      answered: questions.filter((q) => q.status === "answered").length,
    },
    polls: {
      total: polls.length,
      responses: polls.reduce((sum, p) => sum + p.totalVotes, 0),
    },
    engagement: {
      average: Math.round(engagementAvg),
      scores: engagementScores,
    },
    feedback: {
      total: feedback.length,
      avgQuality: feedback.length > 0 ? Number((feedback.reduce((s, f) => s + f.quality, 0) / feedback.length).toFixed(1)) : 0,
      avgEngagement: feedback.length > 0 ? Number((feedback.reduce((s, f) => s + f.engagement, 0) / feedback.length).toFixed(1)) : 0,
      avgImpact: feedback.length > 0 ? Number((feedback.reduce((s, f) => s + f.impact, 0) / feedback.length).toFixed(1)) : 0,
    },
  });
});

export const getMentorControlCenterData = asyncHandler(async (req, res) => {
  const sessionId = req.params.sessionId;
  const session = await Session.findById(sessionId).populate("mentor", "fullName avatar");
  if (!session) return sendResponse(res, 404, "Session not found");

  const isMentor = String(session.mentor?._id || session.mentor) === String(req.user._id);
  if (!isMentor && req.user.role !== "admin") {
    return sendResponse(res, 403, "Access denied");
  }

  const [participants, waitingQueue, questions, polls, engagementSummary, raisedHands, chatActivity] = await Promise.all([
    SessionParticipant.find({ session: sessionId })
      .populate("user", "fullName avatar role")
      .sort({ status: 1, joinedAt: -1 })
      .lean(),
    SessionParticipant.find({ session: sessionId, admissionStatus: "waiting" })
      .populate("user", "fullName avatar role")
      .sort({ createdAt: 1 })
      .lean(),
    SessionQuestion.find({ session: sessionId, status: { $ne: "archived" } })
      .sort({ isPinned: -1, upvoteCount: -1, createdAt: 1 }),
    SessionPoll.find({ session: sessionId, status: "active" }),
    EngagementScore.aggregate([
      { $match: { session: sessionId } },
      { $group: { _id: null, avgScore: { $avg: "$score" }, total: { $sum: 1 } } },
    ]),
    (await import("../services/handRaiseService.js")).getRaisedHandsQueue(sessionId),
    ChatMessage.countDocuments({ roomId: { $in: [`session-${sessionId}`, `classroom-${sessionId}`] } }),
  ]);

  const liveDuration = session.liveStartedAt
    ? Math.round((Date.now() - new Date(session.liveStartedAt).getTime()) / 1000)
    : 0;

  const liveParticipants = participants.filter((p) => ["joined", "active"].includes(p.status));
  const verifiedCount = participants.filter((p) => p.verifiedAttendance).length;
  const attendancePercent = participants.length > 0
    ? Math.round((verifiedCount / participants.length) * 100)
    : 0;

  const engSummary = engagementSummary[0] || { avgScore: 0, total: 0 };

  sendResponse(res, 200, "Mentor control center data", {
    overview: {
      liveParticipants: liveParticipants.length,
      waitingParticipants: waitingQueue.length,
      sessionDuration: liveDuration,
      attendancePercent,
      engagementScore: Math.round(engSummary.avgScore),
      questionsWaiting: questions.filter((q) => q.status === "pending").length,
      raisedHands: raisedHands.length,
      activePolls: polls.length,
      chatActivity,
    },
    participants: liveParticipants.map((p) => ({
      id: p._id,
      userId: p.user?._id,
      name: p.user?.fullName || "Unknown",
      avatar: p.user?.avatar,
      role: p.role,
      status: p.status,
      attendanceDuration: p.totalPresenceMs ? Math.round(p.totalPresenceMs / 1000) : 0,
      joinedAt: p.joinedAt,
      verifiedAttendance: p.verifiedAttendance,
      admissionStatus: p.admissionStatus,
    })),
    waitingQueue: waitingQueue.map((w) => ({
      id: w._id,
      userId: w.user?._id,
      name: w.user?.fullName || "Unknown",
      avatar: w.user?.avatar,
      joinedAt: w.createdAt,
    })),
    raisedHands: raisedHands.map((h) => ({
      userId: h.student?._id,
      name: h.student?.fullName || "Unknown",
      queuePosition: h.queuePosition,
      raisedAt: h.createdAt,
    })),
    questions: questions.map((q) => ({
      id: q._id,
      userId: q.student?._id,
      studentName: q.student?.fullName || "Unknown",
      text: q.text,
      status: q.status,
      isPinned: q.isPinned,
      upvoteCount: q.upvoteCount,
      reply: q.reply,
      createdAt: q.createdAt,
    })),
    polls: polls.map((p) => ({
      id: p._id,
      question: p.question,
      type: p.type,
      status: p.status,
      options: p.options.map((o, i) => ({
        index: i,
        text: o.text,
        voteCount: o.voteCount,
        percentage: p.totalVotes > 0 ? Math.round((o.voteCount / p.totalVotes) * 100) : 0,
      })),
      totalVotes: p.totalVotes,
      createdAt: p.createdAt,
    })),
    engagementScores: await EngagementScore.find({ session: sessionId })
      .populate("student", "fullName avatar")
      .sort({ score: -1 }),
  });
});

export const getCohortAnalytics = asyncHandler(async (req, res) => {
  const mentorId = req.user._id;
  const { trackId, startDate, endDate } = req.query;

  const matchStage = { mentor: mentorId };
  if (startDate || endDate) {
    matchStage.scheduledAt = {};
    if (startDate) matchStage.scheduledAt.$gte = new Date(startDate);
    if (endDate) matchStage.scheduledAt.$lte = new Date(endDate);
  }

  const sessionFilter = { ...matchStage };
  if (trackId) sessionFilter.track = trackId;

  const sessions = await Session.find(sessionFilter).lean();
  const sessionIds = sessions.map(s => s._id);

  const participantStats = await SessionParticipant.aggregate([
    { $match: { session: { $in: sessionIds } } },
    {
      $group: {
        _id: "$session",
        totalParticipants: { $sum: 1 },
        verifiedAttendance: { $sum: { $cond: ["$verifiedAttendance", 1, 0] } },
        avgPresenceMs: { $avg: "$totalPresenceMs" },
      },
    },
  ]);

  const engagementStats = await EngagementScore.aggregate([
    { $match: { session: { $in: sessionIds } } },
    {
      $group: {
        _id: "$session",
        avgScore: { $avg: "$score" },
        studentCount: { $sum: 1 },
      },
    },
  ]);

  const feedbackStats = await SessionFeedback.aggregate([
    { $match: { session: { $in: sessionIds } } },
    {
      $group: {
        _id: "$session",
        avgQuality: { $avg: "$quality" },
        avgEngagement: { $avg: "$engagement" },
        avgImpact: { $avg: "$impact" },
        count: { $sum: 1 },
      },
    },
  ]);

  const trackStats = sessions.reduce((acc, s) => {
    const track = s.track || "Unassigned";
    if (!acc[track]) {
      acc[track] = { sessions: 0, totalParticipants: 0, avgAttendanceRate: 0 };
    }
    acc[track].sessions += 1;
    const pStats = participantStats.find(p => String(p._id) === String(s._id));
    if (pStats) {
      acc[track].totalParticipants += pStats.totalParticipants;
    }
    return acc;
  }, {});

  const sessionsByMonth = sessions.reduce((acc, s) => {
    const month = s.scheduledAt ? new Date(s.scheduledAt).toISOString().slice(0, 7) : "unknown";
    if (!acc[month]) {
      acc[month] = { count: 0, participants: 0, engagement: 0 };
    }
    acc[month].count += 1;
    const pStats = participantStats.find(p => String(p._id) === String(s._id));
    const eStats = engagementStats.find(e => String(e._id) === String(s._id));
    if (pStats) acc[month].participants += pStats.totalParticipants;
    if (eStats) acc[month].engagement += eStats.avgScore;
    return acc;
  }, {});

  sendResponse(res, 200, "Cohort analytics", {
    overview: {
      totalSessions: sessions.length,
      totalTracks: Object.keys(trackStats).length,
      sessions: participantStats.reduce((sum, p) => sum + p.totalParticipants, 0),
      avgAttendance: participantStats.length > 0
        ? Math.round(participantStats.reduce((sum, p) => sum + (p.totalParticipants > 0 ? (p.verifiedAttendance / p.totalParticipants) * 100 : 0), 0) / participantStats.length)
        : 0,
      avgEngagement: engagementStats.length > 0
        ? Math.round(engagementStats.reduce((sum, e) => sum + e.avgScore, 0) / engagementStats.length)
        : 0,
      avgFeedbackRating: feedbackStats.length > 0
        ? Number((feedbackStats.reduce((sum, f) => sum + (f.avgQuality + f.avgEngagement + f.avgImpact) / 3, 0) / feedbackStats.length * 20).toFixed(1))
        : 0,
    },
    byTrack: trackStats,
    byMonth: sessionsByMonth,
    sessions: sessions.map(s => {
      const pStats = participantStats.find(p => String(p._id) === String(s._id));
      const eStats = engagementStats.find(e => String(e._id) === String(s._id));
      const fStats = feedbackStats.find(f => String(f._id) === String(s._id));
      return {
        id: s._id,
        title: s.title,
        scheduledAt: s.scheduledAt,
        status: s.status,
        track: s.track,
        participants: pStats?.totalParticipants || 0,
        attendanceRate: pStats?.totalParticipants > 0 ? Math.round((pStats.verifiedAttendance / pStats.totalParticipants) * 100) : 0,
        avgEngagement: eStats ? Math.round(eStats.avgScore) : 0,
        avgFeedback: fStats ? Number(((fStats.avgQuality + fStats.avgEngagement + fStats.avgImpact) / 3 * 20).toFixed(1)) : null,
      };
    }),
  });
});

export const getStudentProgress = asyncHandler(async (req, res) => {
  const { studentId } = req.params;
  const mentorId = req.user._id;

  const sessions = await Session.find({ mentor: mentorId }).lean();
  const sessionIds = sessions.map(s => s._id);

  const studentParticipation = await SessionParticipant.find({
    session: { $in: sessionIds },
    user: studentId,
  }).populate("session", "title scheduledAt status").lean();

  const engagementScores = await EngagementScore.find({
    session: { $in: sessionIds },
    student: studentId,
  }).populate("session", "title scheduledAt").lean();

  const feedback = await SessionFeedback.find({
    session: { $in: sessionIds },
    student: studentId,
  }).lean();

  const totalSessions = studentParticipation.length;
  const attendedSessions = studentParticipation.filter(p => p.verifiedAttendance).length;
  const avgPresence = totalSessions > 0
    ? studentParticipation.reduce((sum, p) => sum + (p.totalPresenceMs || 0), 0) / totalSessions / 60000
    : 0;
  const avgEngagement = engagementScores.length > 0
    ? engagementScores.reduce((sum, e) => sum + e.score, 0) / engagementScores.length
    : 0;

  sendResponse(res, 200, "Student progress", {
    studentId,
    stats: {
      totalSessions,
      attendedSessions,
      attendanceRate: totalSessions > 0 ? Math.round((attendedSessions / totalSessions) * 100) : 0,
      avgPresenceMinutes: Math.round(avgPresence),
      avgEngagement: Math.round(avgEngagement),
      feedbackCount: feedback.length,
    },
    sessions: studentParticipation.map(p => ({
      session: p.session,
      status: p.status,
      verifiedAttendance: p.verifiedAttendance,
      presenceMinutes: Math.round((p.totalPresenceMs || 0) / 60000),
    })),
    engagement: engagementScores.map(e => ({
      session: e.session,
      score: e.score,
      details: e.details,
    })),
  });
});

export const exportAnalyticsCSV = asyncHandler(async (req, res) => {
  const mentorId = req.user._id;
  const sessions = await Session.find({ mentor: mentorId })
    .populate("track", "title")
    .sort({ scheduledAt: -1 })
    .lean();

  const participantStats = await SessionParticipant.aggregate([
    { $match: { session: { $in: sessions.map(s => s._id) } } },
    {
      $group: {
        _id: "$session",
        totalParticipants: { $sum: 1 },
        verifiedAttendance: { $sum: { $cond: ["$verifiedAttendance", 1, 0] } },
      },
    },
  ]);

  const engagementStats = await EngagementScore.aggregate([
    { $match: { session: { $in: sessions.map(s => s._id) } } },
    {
      $group: {
        _id: "$session",
        avgScore: { $avg: "$score" },
      },
    },
  ]);

  const feedbackStats = await SessionFeedback.aggregate([
    { $match: { session: { $in: sessions.map(s => s._id) } } },
    {
      $group: {
        _id: "$session",
        avgQuality: { $avg: "$quality" },
        count: { $sum: 1 },
      },
    },
  ]);

  const csvRows = [
    ["Session Title", "Scheduled At", "Status", "Track", "Participants", "Attendance %", "Engagement Score", "Avg Quality Rating"],
  ];

  for (const session of sessions) {
    const pStats = participantStats.find(p => String(p._id) === String(session._id));
    const eStats = engagementStats.find(e => String(e._id) === String(session._id));
    const fStats = feedbackStats.find(f => String(f._id) === String(session._id));

    csvRows.push([
      session.title || "",
      session.scheduledAt ? new Date(session.scheduledAt).toISOString() : "",
      session.status || "",
      session.track?.title || "",
      String(pStats?.totalParticipants || 0),
      String(pStats?.totalParticipants > 0 ? Math.round((pStats.verifiedAttendance / pStats.totalParticipants) * 100) : 0),
      String(Math.round(eStats?.avgScore || 0)),
      fStats?.avgQuality ? String(Number((fStats.avgQuality * 20).toFixed(1))) : "",
    ]);
  }

  const csv = csvRows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename="mentor-analytics-${new Date().toISOString().slice(0, 10)}.csv"`);
  res.send(csv);
});
