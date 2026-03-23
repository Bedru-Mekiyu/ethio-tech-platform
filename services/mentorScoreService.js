import SessionFeedback from "../models/SessionFeedback.js";
import Session from "../models/Session.js";
import User from "../models/User.js";

const roundTo2 = (value) => Math.round(value * 100) / 100;

export const recomputeMentorContribution = async (mentorId) => {
  const [feedbackSummary, endedSessions] = await Promise.all([
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
    Session.countDocuments({ mentor: mentorId, status: "ended" }),
  ]);

  const summary = feedbackSummary[0] || {
    avgQuality: 0,
    avgEngagement: 0,
    avgImpact: 0,
    feedbackCount: 0,
  };

  const weightedFivePointScore =
    summary.avgQuality * 0.4 + summary.avgEngagement * 0.3 + summary.avgImpact * 0.3;
  const mentorScore = roundTo2(weightedFivePointScore * 20);

  await User.findByIdAndUpdate(mentorId, {
    mentorScore,
    totalSessions: endedSessions,
  });

  return {
    mentorScore,
    totalSessions: endedSessions,
    feedbackCount: summary.feedbackCount,
    averages: {
      quality: roundTo2(summary.avgQuality),
      engagement: roundTo2(summary.avgEngagement),
      impact: roundTo2(summary.avgImpact),
    },
  };
};
