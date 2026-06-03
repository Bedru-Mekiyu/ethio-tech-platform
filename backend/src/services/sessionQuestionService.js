import SessionQuestion from "../models/SessionQuestion.js";
import SessionAuditLog from "../models/SessionAuditLog.js";

export const createQuestion = async ({ sessionId, userId, text }) => {
  const question = await SessionQuestion.create({
    session: sessionId,
    student: userId,
    text: text.trim(),
  });
  return question;
};

export const editQuestion = async ({ questionId, userId, text }) => {
  const question = await SessionQuestion.findOne({ _id: questionId, student: userId });
  if (!question) throw new Error("Question not found or not yours");
  if (question.status !== "pending") throw new Error("Can only edit pending questions");
  question.text = text.trim();
  await question.save();
  return question;
};

export const deleteQuestion = async ({ questionId, userId }) => {
  const question = await SessionQuestion.findOne({ _id: questionId, student: userId });
  if (!question) throw new Error("Question not found or not yours");
  await question.deleteOne();
  return { deleted: true };
};

export const upvoteQuestion = async ({ questionId, userId }) => {
  const question = await SessionQuestion.findById(questionId);
  if (!question) throw new Error("Question not found");
  const alreadyUpvoted = question.upvotes.some((id) => String(id) === String(userId));
  if (alreadyUpvoted) {
    question.upvotes = question.upvotes.filter((id) => String(id) !== String(userId));
    question.upvoteCount = Math.max(0, question.upvoteCount - 1);
  } else {
    question.upvotes.push(userId);
    question.upvoteCount += 1;
  }
  await question.save();
  return { upvoteCount: question.upvoteCount, upvoted: !alreadyUpvoted };
};

export const answerQuestion = async ({ questionId, mentorId, text }) => {
  const question = await SessionQuestion.findById(questionId);
  if (!question) throw new Error("Question not found");
  question.status = "answered";
  question.reply = { text: text.trim(), repliedBy: mentorId, repliedAt: new Date() };
  question.answeredAt = new Date();
  await question.save();
  return question;
};

export const pinQuestion = async ({ questionId }) => {
  const question = await SessionQuestion.findById(questionId);
  if (!question) throw new Error("Question not found");
  question.isPinned = !question.isPinned;
  await question.save();
  return question;
};

export const archiveQuestion = async ({ questionId }) => {
  const question = await SessionQuestion.findById(questionId);
  if (!question) throw new Error("Question not found");
  question.status = "archived";
  question.archivedAt = new Date();
  await question.save();
  return question;
};

export const setQuestionStatus = async ({ questionId, status }) => {
  const question = await SessionQuestion.findById(questionId);
  if (!question) throw new Error("Question not found");
  question.status = status;
  if (status === "answered") question.answeredAt = new Date();
  if (status === "archived") question.archivedAt = new Date();
  await question.save();
  return question;
};

export const getSessionQuestions = async ({ sessionId, status, includeArchived = false }) => {
  const filter = { session: sessionId };
  if (status) filter.status = status;
  if (!includeArchived) filter.status = { $ne: "archived" };
  const questions = await SessionQuestion.find(filter)
    .populate("student", "fullName avatar")
    .populate("reply.repliedBy", "fullName")
    .sort({ isPinned: -1, upvoteCount: -1, createdAt: 1 });
  return questions;
};

export const getQuestionStats = async (sessionId) => {
  const stats = await SessionQuestion.aggregate([
    { $match: { session: sessionId } },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    },
  ]);
  const total = stats.reduce((acc, s) => acc + s.count, 0);
  const waiting = stats.find((s) => s._id === "pending")?.count || 0;
  return { total, waiting, answered: stats.find((s) => s._id === "answered")?.count || 0, byStatus: stats };
};

export const logQuestionAudit = async ({ sessionId, userId, action, targetUserId, metadata, ip }) => {
  return SessionAuditLog.create({
    session: sessionId,
    action,
    actor: userId,
    targetUser: targetUserId,
    metadata,
    ip,
  });
};
