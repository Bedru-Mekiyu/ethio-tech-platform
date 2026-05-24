import Submission from "../models/Submission.js";
import Track from "../models/Track.js";
import User from "../models/User.js";

const toCompactCount = (value) => {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  return String(value);
};

export const getMarketingHomeData = async () => {
  const [
    activeLearners,
    mentorNetwork,
    trackCount,
    submissionSummary,
    featuredTracks,
    featuredMentors,
    featuredLearners,
  ] = await Promise.all([
    User.countDocuments({ role: "student" }),
    User.countDocuments({ role: "mentor" }),
    Track.countDocuments({ isActive: true }),
    Submission.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          approved: {
            $sum: {
              $cond: [{ $eq: ["$status", "approved"] }, 1, 0],
            },
          },
        },
      },
    ]),
    Track.find({ isActive: true })
      .sort({ xpReward: -1, createdAt: 1 })
      .limit(3)
      .populate("modules", "title order")
      .select("title description category xpReward modules")
      .lean(),
    User.find({ role: "mentor" })
      .sort({ mentorScore: -1, totalSessions: -1, createdAt: 1 })
      .limit(3)
      .select("fullName avatar mentorScore totalSessions expertise currentCompany")
      .lean(),
    User.find({ role: "student" })
      .sort({ xp: -1, level: -1, createdAt: 1 })
      .limit(3)
      .select("fullName avatar xp level gradeLevel")
      .lean(),
  ]);

  const submissionStats = submissionSummary[0] || { total: 0, approved: 0 };
  const approvalRate = submissionStats.total
    ? Math.round((submissionStats.approved / submissionStats.total) * 100)
    : 0;

  return {
    stats: {
      activeLearners,
      mentorNetwork,
      trackCount,
      approvalRate,
    },
    hero: {
      activeLearners,
      topLearnerXp: featuredLearners[0]?.xp ?? 0,
      topMentorScore: featuredMentors[0]?.mentorScore ?? 0,
      topMentorName: featuredMentors[0]?.fullName ?? "",
    },
    featuredTracks: featuredTracks.map((track) => ({
      _id: track._id,
      title: track.title,
      description: track.description,
      category: track.category,
      xpReward: track.xpReward,
      moduleCount: track.modules?.length ?? 0,
    })),
    featuredMentors: featuredMentors.map((mentor) => ({
      _id: mentor._id,
      fullName: mentor.fullName,
      avatar: mentor.avatar,
      mentorScore: mentor.mentorScore ?? 0,
      totalSessions: mentor.totalSessions ?? 0,
      expertise: mentor.expertise ?? [],
      currentCompany: mentor.currentCompany ?? "",
    })),
    featuredLearners: featuredLearners.map((learner) => ({
      _id: learner._id,
      fullName: learner.fullName,
      avatar: learner.avatar,
      xp: learner.xp ?? 0,
      level: learner.level ?? 1,
      gradeLevel: learner.gradeLevel,
    })),
    compact: {
      activeLearners: toCompactCount(activeLearners),
      mentorNetwork: toCompactCount(mentorNetwork),
      trackCount: toCompactCount(trackCount),
    },
  };
};
