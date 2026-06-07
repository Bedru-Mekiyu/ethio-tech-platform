import Session from "../models/Session.js";
import SessionParticipant from "../models/SessionParticipant.js";
import EngagementScore from "../models/EngagementScore.js";
import MentorStudentFeedback from "../models/MentorStudentFeedback.js";
import asyncHandler from "../utils/asyncHandler.js";
import { sendResponse } from "../utils/apiResponse.js";

export const getMentorStudents = asyncHandler(async (req, res) => {
  const mentorId = req.user._id;

  // Find all sessions this mentor has run
  const sessions = await Session.find({ mentor: mentorId }).select("_id title").lean();
  const sessionIds = sessions.map((s) => s._id);
  const sessionMap = new Map(sessions.map((s) => [String(s._id), s.title]));

  if (sessionIds.length === 0) {
    return sendResponse(res, 200, "Mentor students fetched", {
      students: [],
      totalStudents: 0,
      averageEngagement: 0,
      averageAttendance: 0,
    });
  }

  // Get all participants across those sessions
  const participants = await SessionParticipant.find({ session: { $in: sessionIds } })
    .populate("user", "fullName email avatar level xp enrolledTracks lastActiveAt")
    .lean();

  // Aggregate by student
  const studentMap = new Map();
  for (const p of participants) {
    if (!p.user) continue;
    const uid = String(p.user._id);
    if (!studentMap.has(uid)) {
      studentMap.set(uid, {
        _id: uid,
        fullName: p.user.fullName || "Unknown",
        email: p.user.email,
        avatar: p.user.avatar,
        level: p.user.level || 1,
        xp: p.user.xp || 0,
        enrolledTracks: p.user.enrolledTracks || [],
        lastActiveAt: p.user.lastActiveAt,
        sessionsAttended: 0,
        totalSessions: 0,
        totalPresenceMs: 0,
      });
    }
    const student = studentMap.get(uid);
    student.totalSessions += 1;
    if (p.verifiedAttendance || ["joined", "active", "completed"].includes(p.status)) {
      student.sessionsAttended += 1;
    }
    student.totalPresenceMs += p.totalPresenceMs || 0;
  }

  // Get engagement scores
  const engagementScores = await EngagementScore.find({ session: { $in: sessionIds } })
    .select("student score questionsAsked pollParticipations chatMessages attendanceMs")
    .lean();

  const engagementByStudent = new Map();
  for (const eg of engagementScores) {
    const uid = String(eg.student);
    if (!engagementByStudent.has(uid)) {
      engagementByStudent.set(uid, { total: 0, count: 0 });
    }
    const entry = engagementByStudent.get(uid);
    entry.total += eg.score || 0;
    entry.count += 1;
  }

  // Get feedback history
  const feedbacks = await MentorStudentFeedback.find({
    mentor: mentorId,
    session: { $in: sessionIds },
  })
    .sort({ createdAt: -1 })
    .lean();

  const feedbackByStudent = new Map();
  for (const fb of feedbacks) {
    const uid = String(fb.student);
    if (!feedbackByStudent.has(uid)) {
      feedbackByStudent.set(uid, []);
    }
    feedbackByStudent.get(uid).push({
      sessionTitle: sessionMap.get(String(fb.session)) || "Session",
      participationScore: fb.participationScore,
      communicationScore: fb.communicationScore,
      professionalismScore: fb.professionalismScore,
      comment: fb.comment,
      createdAt: fb.createdAt,
    });
  }

  // Build final student list
  const students = [];
  let totalEngagement = 0;
  let totalAttendanceRate = 0;

  for (const [uid, student] of studentMap) {
    const engData = engagementByStudent.get(uid);
    const engagementScore = engData && engData.count > 0 ? Math.round(engData.total / engData.count) : 0;
    const feedbackHistory = feedbackByStudent.get(uid) || [];

    const avgFeedbackScore =
      feedbackHistory.length > 0
        ? feedbackHistory.reduce(
            (s, f) => s + (f.participationScore + f.communicationScore + f.professionalismScore) / 3,
            0,
          ) / feedbackHistory.length
        : 0;

    const attendanceRate =
      student.totalSessions > 0 ? Math.round((student.sessionsAttended / student.totalSessions) * 100) : 0;

    totalEngagement += engagementScore;
    totalAttendanceRate += attendanceRate;

    students.push({
      ...student,
      engagementScore,
      averageScore: Number(avgFeedbackScore.toFixed(1)),
      feedbackHistory,
    });
  }

  const studentCount = students.length;

  sendResponse(res, 200, "Mentor students fetched", {
    students,
    totalStudents: studentCount,
    averageEngagement: studentCount > 0 ? Math.round(totalEngagement / studentCount) : 0,
    averageAttendance: studentCount > 0 ? Math.round(totalAttendanceRate / studentCount) : 0,
  });
});
