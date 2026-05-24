import Submission from "../models/Submission.js";
import Session from "../models/Session.js";
import XPLog from "../models/XPLog.js";
import User from "../models/User.js";
import Track from "../models/Track.js";
import Project from "../models/Project.js";
import LessonProgress from "../models/LessonProgress.js";
import SessionFeedback from "../models/SessionFeedback.js";

const toObjectIdString = (value) => String(value);

const computeStudentProgressByTrack = async (userId, enrolledTracks) => {
  if (!enrolledTracks?.length) {
    return [];
  }

  const [trackDocs, completedLessons, approvedSubmissions, totalProjectsByTrack] = await Promise.all([
    Track.find({ _id: { $in: enrolledTracks.map((track) => track._id || track) } })
      .populate({ path: "modules", populate: { path: "lessons", select: "_id" } })
      .select("title modules"),
    LessonProgress.find({ student: userId }).select("lesson"),
    Submission.find({ student: userId, status: "approved" }).populate({ path: "project", select: "track" }),
    Project.aggregate([
      { $match: { track: { $in: enrolledTracks.map((track) => track._id || track) } } },
      { $group: { _id: "$track", total: { $sum: 1 } } },
    ]),
  ]);

  const completedLessonIds = new Set(completedLessons.map((item) => toObjectIdString(item.lesson)));
  const approvedProjectCountMap = new Map();
  for (const submission of approvedSubmissions) {
    const trackId = submission.project?.track ? toObjectIdString(submission.project.track) : null;
    if (!trackId) continue;
    approvedProjectCountMap.set(trackId, (approvedProjectCountMap.get(trackId) || 0) + 1);
  }

  const totalProjectCountMap = new Map(
    totalProjectsByTrack.map((item) => [toObjectIdString(item._id), item.total])
  );

  return trackDocs.map((track) => {
    const lessonIds = track.modules.flatMap((module) => module.lessons.map((lesson) => toObjectIdString(lesson._id)));
    const totalLessons = lessonIds.length;
    const completedLessonCount = lessonIds.filter((lessonId) => completedLessonIds.has(lessonId)).length;

    const trackId = toObjectIdString(track._id);
    const totalProjects = totalProjectCountMap.get(trackId) || 0;
    const approvedProjects = approvedProjectCountMap.get(trackId) || 0;

    const lessonProgress = totalLessons ? Math.round((completedLessonCount / totalLessons) * 100) : 0;
    const projectProgress = totalProjects ? Math.round((approvedProjects / totalProjects) * 100) : 0;
    const overallProgress = Math.round((lessonProgress * 0.6) + (projectProgress * 0.4));

    return {
      trackId: track._id,
      title: track.title,
      lessons: { completed: completedLessonCount, total: totalLessons, progressPercent: lessonProgress },
      projects: { approved: approvedProjects, total: totalProjects, progressPercent: projectProgress },
      overallProgressPercent: overallProgress,
    };
  });
};

export const getStudentDashboardData = async (userId) => {
  const user = await User.findById(userId)
    .select("fullName role level xp badges enrolledTracks gradeLevel")
    .populate("badges", "name category")
    .populate("enrolledTracks", "title category");

  const [recentXp, upcomingSessions, recentSubmissions, leaderboardPosition] = await Promise.all([
    XPLog.find({ user: userId }).sort({ createdAt: -1 }).limit(10),
    Session.find({ participants: userId, scheduledAt: { $gte: new Date() } })
      .sort({ scheduledAt: 1 })
      .limit(5)
      .select("title scheduledAt meetingLink status _id"),
    Submission.find({ student: userId }).sort({ createdAt: -1 }).limit(5).populate("project", "title"),
    User.countDocuments({ xp: { $gt: user?.xp || 0 } }),
  ]);

  const progressByTrack = await computeStudentProgressByTrack(userId, user?.enrolledTracks || []);

  return {
    user,
    recentXp,
    upcomingSessions,
    recentSubmissions,
    progressByTrack,
    leaderboardPosition: leaderboardPosition + 1,
  };
};

export const getMentorDashboardData = async (userId) => {
  const [mentor, mySessions, reviewsDone, recentXpEvents, feedbackSummary, pendingReviews] = await Promise.all([
    User.findById(userId).select("fullName role mentorScore totalSessions expertise"),
    Session.find({ mentor: userId })
      .sort({ scheduledAt: -1 })
      .limit(10)
      .select("title scheduledAt status participants _id"),
    Submission.find({ reviewedBy: userId })
      .sort({ updatedAt: -1 })
      .limit(10)
      .populate("student", "fullName")
      .populate("project", "title"),
    XPLog.find({ user: userId }).sort({ createdAt: -1 }).limit(10),
    SessionFeedback.aggregate([
      { $match: { mentor: userId } },
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
    Submission.countDocuments({ status: "pending" }),
  ]);

  const summary = feedbackSummary[0] || {
    avgQuality: 0,
    avgEngagement: 0,
    avgImpact: 0,
    feedbackCount: 0,
  };

  const upcomingSessions = mySessions
    .filter((session) => new Date(session.scheduledAt) >= new Date() && session.status !== "canceled")
    .sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt));

  const activeStudents = new Set(
    mySessions.flatMap((session) => session.participants?.map((participant) => String(participant)) ?? [])
  ).size;

  return {
    mentor,
    mySessions,
    upcomingSessions,
    reviewsDone,
    recentXpEvents,
    pendingReviews,
    activeStudents,
    contributionMetrics: {
      quality: Number(summary.avgQuality?.toFixed?.(2) || 0),
      engagement: Number(summary.avgEngagement?.toFixed?.(2) || 0),
      impact: Number(summary.avgImpact?.toFixed?.(2) || 0),
      feedbackCount: summary.feedbackCount,
    },
  };
};
