import Cohort from "../models/Cohort.js";
import StudentProgress from "../models/StudentProgress.js";
import Session from "../models/Session.js";
import SessionParticipant from "../models/SessionParticipant.js";
import EngagementScore from "../models/EngagementScore.js";

export const createCohort = async ({ name, description, mentor, track, startDate, endDate, maxStudents, tags }) => {
  return Cohort.create({ name, description, mentor, track, startDate, endDate, maxStudents, tags });
};

export const getCohorts = async (mentorId, status) => {
  const filter = { mentor: mentorId };
  if (status) filter.status = status;
  return Cohort.find(filter)
    .populate("track", "title")
    .populate("students", "fullName avatar")
    .sort({ createdAt: -1 });
};

export const getCohort = async (cohortId) => {
  return Cohort.findById(cohortId)
    .populate("track", "title")
    .populate("students", "fullName avatar role");
};

export const updateCohort = async (cohortId, updates) => {
  return Cohort.findByIdAndUpdate(cohortId, updates, { new: true })
    .populate("track", "title")
    .populate("students", "fullName avatar");
};

export const addStudentToCohort = async (cohortId, userId) => {
  const cohort = await Cohort.findById(cohortId);
  if (!cohort) throw new Error("Cohort not found");
  if (cohort.students.includes(userId)) return cohort;

  if (cohort.students.length >= cohort.maxStudents) {
    throw new Error("Cohort is full");
  }

  cohort.students.push(userId);
  await cohort.save();

  await StudentProgress.findOneAndUpdate(
    { userId, cohortId },
    { userId, cohortId },
    { upsert: true }
  );

  return cohort;
};

export const removeStudentFromCohort = async (cohortId, userId) => {
  await Cohort.findByIdAndUpdate(cohortId, { $pull: { students: userId } });
  await StudentProgress.deleteOne({ userId, cohortId });
};

export const getCohortAnalytics = async (cohortId) => {
  const cohort = await Cohort.findById(cohortId).populate("track", "title");
  if (!cohort) throw new Error("Cohort not found");

  const sessions = await Session.find({ mentor: cohort.mentor, track: cohort.track }).lean();
  const sessionIds = sessions.map(s => s._id);

  const progressData = await StudentProgress.find({ cohortId });

  const studentStats = await SessionParticipant.aggregate([
    { $match: { session: { $in: sessionIds }, user: { $in: cohort.students } } },
    {
      $group: {
        _id: "$user",
        sessionsAttended: { $sum: { $cond: ["$verifiedAttendance", 1, 0] } },
        totalPresenceMs: { $sum: "$totalPresenceMs" },
      },
    },
  ]);

  const engagementData = await EngagementScore.aggregate([
    { $match: { session: { $in: sessionIds }, student: { $in: cohort.students } } },
    {
      $group: {
        _id: "$student",
        avgScore: { $avg: "$score" },
        totalSessions: { $sum: 1 },
      },
    },
  ]);

  const totalStudents = cohort.students.length;
  const totalSessions = sessions.length;

  return {
    cohort: {
      id: cohort._id,
      name: cohort.name,
      description: cohort.description,
      status: cohort.status,
      startDate: cohort.startDate,
      endDate: cohort.endDate,
      track: cohort.track,
      studentCount: totalStudents,
      maxStudents: cohort.maxStudents,
    },
    overview: {
      totalStudents,
      totalSessions,
      avgAttendanceRate: studentStats.length > 0
        ? Math.round(studentStats.reduce((sum, s) => {
            const sessionCount = sessions.length;
            return sum + (sessionCount > 0 ? (s.sessionsAttended / sessionCount) * 100 : 0);
          }, 0) / studentStats.length)
        : 0,
      avgEngagement: engagementData.length > 0
        ? Math.round(engagementData.reduce((sum, e) => sum + e.avgScore, 0) / engagementData.length)
        : 0,
      activeStudents: studentStats.filter(s => s.totalPresenceMs > 0).length,
    },
    students: cohort.students.map(studentId => {
      const stat = studentStats.find(s => String(s._id) === String(studentId));
      const eng = engagementData.find(e => String(e._id) === String(studentId));
      return {
        userId: studentId,
        sessionsAttended: stat?.sessionsAttended || 0,
        avgEngagement: eng ? Math.round(eng.avgScore) : 0,
      };
    }),
    progress: progressData,
  };
};

export const bulkUpdateProgress = async (cohortId) => {
  const cohort = await Cohort.findById(cohortId);
  if (!cohort) throw new Error("Cohort not found");

  const sessions = await Session.find({ mentor: cohort.mentor, track: cohort.track }).lean();
  const sessionIds = sessions.map(s => s._id);

  for (const studentId of cohort.students) {
    const participations = await SessionParticipant.find({
      session: { $in: sessionIds },
      user: studentId,
    });

    const engagements = await EngagementScore.find({
      session: { $in: sessionIds },
      student: studentId,
    });

    const totalAttended = participations.filter(p => p.verifiedAttendance).length;
    const avgEngagement = engagements.length > 0
      ? engagements.reduce((sum, e) => sum + e.score, 0) / engagements.length
      : 0;

    await StudentProgress.findOneAndUpdate(
      { userId: studentId, cohortId },
      {
        totalSessionsAttended: totalAttended,
        totalSessionsAvailable: sessions.length,
        attendanceRate: sessions.length > 0 ? Math.round((totalAttended / sessions.length) * 100) : 0,
        avgEngagementScore: Math.round(avgEngagement),
      },
      { upsert: true }
    );
  }
};
