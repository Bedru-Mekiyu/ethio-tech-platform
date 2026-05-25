import Submission from "../models/Submission.js";
import Session from "../models/Session.js";
import XPLog from "../models/XPLog.js";
import User from "../models/User.js";
import Track from "../models/Track.js";
import Project from "../models/Project.js";
import LessonProgress from "../models/LessonProgress.js";
import SessionFeedback from "../models/SessionFeedback.js";
import UserStreak from "../models/UserStreak.js";
import PeerGroup from "../models/PeerGroup.js";
import { getChallengeCompletionForUser, getTodayChallenge } from "./gamificationService.js";

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

  const [
    recentXp,
    upcomingSessions,
    recentSubmissions,
    leaderboardPosition,
    streak,
    assignedProjects,
    dailyChallenge,
    completedLessonCount,
    submissionCount,
    sessionCount,
    peerGroupCount,
  ] = await Promise.all([
    XPLog.find({ user: userId }).sort({ createdAt: -1 }).limit(10),
    Session.find({ participants: userId, scheduledAt: { $gte: new Date() } })
      .sort({ scheduledAt: 1 })
      .limit(5)
      .select("title scheduledAt meetingLink status _id"),
    Submission.find({ student: userId }).sort({ createdAt: -1 }).limit(5).populate("project", "title"),
    User.countDocuments({ role: "student", xp: { $gt: user?.xp || 0 } }),
    UserStreak.findOne({ user: userId }).select("currentStreak longestStreak lastActiveDate"),
    Project.find({ track: { $in: (user?.enrolledTracks || []).map((track) => track._id || track) } })
      .sort({ createdAt: -1 })
      .populate("track", "title"),
    getTodayChallenge(),
    LessonProgress.countDocuments({ student: userId }),
    Submission.countDocuments({ student: userId }),
    Session.countDocuments({ participants: userId }),
    PeerGroup.countDocuments({ isActive: true, $or: [{ members: userId }, { leader: userId }] }),
  ]);

  const progressByTrack = await computeStudentProgressByTrack(userId, user?.enrolledTracks || []);
  const submissionMap = new Map();
  for (const submission of await Submission.find({ student: userId }).sort({ createdAt: -1 }).populate("project", "title track xpReward")) {
    const projectId = String(submission.project?._id ?? submission.project);
    if (!submissionMap.has(projectId)) {
      submissionMap.set(projectId, submission);
    }
  }

  const assignedProjectsById = new Map();
  for (const project of assignedProjects) {
    const projectId = String(project._id);
    const submission = submissionMap.get(projectId);
    const track = project.track;
    const trackProgress = progressByTrack.find((item) => String(item.trackId) === String(track?._id ?? track));
    const submissionStatus = submission?.status ?? "not-submitted";
    const completionPercent =
      submissionStatus === "approved"
        ? 100
        : submissionStatus === "reviewed"
          ? 72
          : submissionStatus === "rejected"
            ? 42
            : submissionStatus === "pending"
              ? 24
              : 8;

    const category =
      submissionStatus === "approved"
        ? "completed"
        : submissionStatus === "reviewed" || submissionStatus === "rejected"
          ? "feedback"
          : "active";

    assignedProjectsById.set(projectId, {
      projectId,
      title: project.title,
      description: project.description,
      trackId: track?._id ?? track,
      trackTitle: track?.title ?? "Learning track",
      difficulty: project.difficulty,
      xpReward: project.xpReward ?? 0,
      category,
      completionPercent: trackProgress ? Math.max(completionPercent, trackProgress.overallProgressPercent) : completionPercent,
      submissionStatus,
      feedback: submission?.feedback,
      grade: submission?.grade,
      submittedAt: submission?.createdAt,
      updatedAt: submission?.updatedAt ?? project.updatedAt,
      githubLink: submission?.githubLink,
      deployedUrl: submission?.deployedUrl,
    });
  }

  const onboardingItems = [
    {
      key: "profile",
      label: "Complete your learner profile",
      completed: Boolean(user?.gradeLevel),
      href: "/app/profile",
    },
    {
      key: "track",
      label: "Enroll in a learning track",
      completed: Boolean(user?.enrolledTracks?.length),
      href: "/app/tracks",
    },
    {
      key: "lesson",
      label: "Finish your first lesson",
      completed: completedLessonCount > 0,
      href: "/app/tracks",
    },
    {
      key: "project",
      label: "Submit your first project",
      completed: submissionCount > 0,
      href: "/app/projects",
    },
    {
      key: "session",
      label: "Join a mentor session",
      completed: sessionCount > 0,
      href: "/app/sessions",
    },
    {
      key: "squad",
      label: "Join a collaboration squad",
      completed: peerGroupCount > 0,
      href: "/app/squads",
    },
  ];

  const completedOnboardingItems = onboardingItems.filter((item) => item.completed).length;
  const dailyChallengeCompleted = dailyChallenge
    ? Boolean(await getChallengeCompletionForUser(userId, dailyChallenge._id))
    : false;

  return {
    user,
    recentXp,
    upcomingSessions,
    recentSubmissions,
    progressByTrack,
    assignedProjects: Array.from(assignedProjectsById.values()),
    leaderboardPosition: leaderboardPosition + 1,
    streak,
    dailyChallenge,
    dailyChallengeCompleted,
    onboarding: {
      completed: completedOnboardingItems,
      total: onboardingItems.length,
      percent: Math.round((completedOnboardingItems / onboardingItems.length) * 100),
      items: onboardingItems,
    },
    nextActions: onboardingItems
      .filter((item) => !item.completed)
      .slice(0, 3)
      .map((item) => ({
        label: item.label,
        href: item.href,
      })),
  };
};

export const getMentorDashboardData = async (userId) => {
  const [mentor, mySessions, reviewsDone, recentXpEvents, feedbackSummary, pendingReviews] = await Promise.all([
    User.findById(userId).select("fullName role mentorScore totalSessions expertise isVerified"),
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
