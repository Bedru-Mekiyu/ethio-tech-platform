import EngagementScore from "../models/EngagementScore.js";
import SessionQuestion from "../models/SessionQuestion.js";
import SessionPoll from "../models/SessionPoll.js";
import SessionParticipant from "../models/SessionParticipant.js";
import ChatMessage from "../models/ChatMessage.js";
import HandRaise from "../models/HandRaise.js";
import SessionResource from "../models/SessionResource.js";

const ENGAGEMENT_WEIGHTS = {
  questionsAsked: 15,
  pollParticipations: 10,
  chatMessages: 5,
  handsRaised: 8,
  resourcesViewed: 5,
  attendanceMs: 0.02,
};

const MAX_SCORE = 100;

export const calculateEngagementScore = async ({ sessionId, userId }) => {
  const session = await SessionParticipant.findOne({ session: sessionId, user: userId });
  if (!session) return { score: 0, details: {} };

  const [questionsCount, pollsVoted, chatCount, handsRaisedCount, resourcesViewed] = await Promise.all([
    SessionQuestion.countDocuments({ session: sessionId, student: userId }),
    SessionPoll.countDocuments({
      session: sessionId,
      "options.votes": userId,
    }),
    ChatMessage.countDocuments({
      roomId: `session-${sessionId}`,
      userId,
    }),
    HandRaise.countDocuments({ session: sessionId, student: userId }),
    SessionResource.countDocuments({
      session: sessionId,
      "views.user": userId,
    }),
  ]);

  const attendanceMs = session.totalPresenceMs || 0;

  const details = {
    questionsAsked: questionsCount,
    pollParticipations: pollsVoted,
    chatMessages: chatCount,
    handsRaised: handsRaisedCount,
    resourcesViewed,
    attendanceMs,
  };

  let rawScore = 0;
  rawScore += questionsCount * ENGAGEMENT_WEIGHTS.questionsAsked;
  rawScore += pollsVoted * ENGAGEMENT_WEIGHTS.pollParticipations;
  rawScore += Math.min(chatCount, 20) * ENGAGEMENT_WEIGHTS.chatMessages;
  rawScore += handsRaisedCount * ENGAGEMENT_WEIGHTS.handsRaised;
  rawScore += resourcesViewed * ENGAGEMENT_WEIGHTS.resourcesViewed;
  rawScore += (attendanceMs / 60000) * ENGAGEMENT_WEIGHTS.attendanceMs;

  const score = Math.min(MAX_SCORE, Math.round(rawScore));

  await EngagementScore.findOneAndUpdate(
    { session: sessionId, student: userId },
    {
      session: sessionId,
      student: userId,
      questionsAsked: questionsCount,
      pollParticipations: pollsVoted,
      chatMessages: chatCount,
      handsRaised: handsRaisedCount,
      resourcesViewed,
      attendanceMs,
      score,
      lastCalculatedAt: new Date(),
    },
    { upsert: true, new: true }
  );

  return { score, details };
};

export const getSessionEngagementScores = async (sessionId) => {
  const scores = await EngagementScore.find({ session: sessionId })
    .populate("student", "fullName avatar")
    .sort({ score: -1 });
  return scores;
};

export const getSessionEngagementSummary = async (sessionId) => {
  const stats = await EngagementScore.aggregate([
    { $match: { session: sessionId } },
    {
      $group: {
        _id: null,
        avgScore: { $avg: "$score" },
        maxScore: { $max: "$score" },
        minScore: { $min: "$score" },
        totalStudents: { $sum: 1 },
        avgQuestions: { $avg: "$questionsAsked" },
        avgPolls: { $avg: "$pollParticipations" },
        avgChat: { $avg: "$chatMessages" },
      },
    },
  ]);

  return stats[0] || { avgScore: 0, maxScore: 0, minScore: 0, totalStudents: 0 };
};

export const getStudentEngagement = async ({ sessionId, userId }) => {
  let engagement = await EngagementScore.findOne({ session: sessionId, student: userId });
  if (!engagement) {
    const result = await calculateEngagementScore({ sessionId, userId });
    engagement = await EngagementScore.findOne({ session: sessionId, student: userId });
    return { engagement, calculated: result };
  }
  return { engagement };
};
