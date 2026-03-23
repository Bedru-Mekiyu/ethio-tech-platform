import Submission from "../models/Submission.js";
import Session from "../models/Session.js";
import XPLog from "../models/XPLog.js";
import User from "../models/User.js";

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
      .select("title scheduledAt meetingLink status"),
    Submission.find({ student: userId }).sort({ createdAt: -1 }).limit(5).populate("project", "title"),
    User.countDocuments({ xp: { $gt: user?.xp || 0 } }),
  ]);

  return {
    user,
    recentXp,
    upcomingSessions,
    recentSubmissions,
    leaderboardPosition: leaderboardPosition + 1,
  };
};

export const getMentorDashboardData = async (userId) => {
  const [mentor, mySessions, reviewsDone, recentXpEvents] = await Promise.all([
    User.findById(userId).select("fullName role mentorScore totalSessions expertise"),
    Session.find({ mentor: userId }).sort({ scheduledAt: -1 }).limit(10),
    Submission.find({ reviewedBy: userId }).sort({ updatedAt: -1 }).limit(10).populate("student", "fullName").populate("project", "title"),
    XPLog.find({ user: userId }).sort({ createdAt: -1 }).limit(10),
  ]);

  return {
    mentor,
    mySessions,
    reviewsDone,
    recentXpEvents,
  };
};
