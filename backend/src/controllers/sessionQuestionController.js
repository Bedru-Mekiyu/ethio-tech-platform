import asyncHandler from "../utils/asyncHandler.js";
import { sendResponse } from "../utils/apiResponse.js";
import ApiError from "../utils/ApiError.js";
import * as questionService from "../services/sessionQuestionService.js";

export const createQuestion = asyncHandler(async (req, res) => {
  const { text } = req.body;
  if (!text?.trim()) throw new ApiError(400, "Question text is required");
  const question = await questionService.createQuestion({
    sessionId: req.params.sessionId,
    userId: req.user._id,
    text,
  });
  sendResponse(res, 201, "Question submitted", { question });
});

export const editQuestion = asyncHandler(async (req, res) => {
  const { text } = req.body;
  if (!text?.trim()) throw new ApiError(400, "Question text is required");
  const question = await questionService.editQuestion({
    questionId: req.params.questionId,
    userId: req.user._id,
    text,
  });
  sendResponse(res, 200, "Question updated", { question });
});

export const deleteQuestion = asyncHandler(async (req, res) => {
  await questionService.deleteQuestion({
    questionId: req.params.questionId,
    userId: req.user._id,
  });
  sendResponse(res, 200, "Question deleted");
});

export const upvoteQuestion = asyncHandler(async (req, res) => {
  const result = await questionService.upvoteQuestion({
    questionId: req.params.questionId,
    userId: req.user._id,
  });
  sendResponse(res, 200, "Vote updated", result);
});

export const answerQuestion = asyncHandler(async (req, res) => {
  const { text } = req.body;
  if (!text?.trim()) throw new ApiError(400, "Answer text is required");
  const question = await questionService.answerQuestion({
    questionId: req.params.questionId,
    mentorId: req.user._id,
    text,
  });
  sendResponse(res, 200, "Question answered", { question });
});

export const pinQuestion = asyncHandler(async (req, res) => {
  const question = await questionService.pinQuestion({ questionId: req.params.questionId });
  sendResponse(res, 200, "Question pin toggled", { question });
});

export const archiveQuestion = asyncHandler(async (req, res) => {
  const question = await questionService.archiveQuestion({ questionId: req.params.questionId });
  sendResponse(res, 200, "Question archived", { question });
});

export const setQuestionStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const valid = ["pending", "answering", "answered", "archived"];
  if (!valid.includes(status)) throw new ApiError(400, `Status must be one of: ${valid.join(", ")}`);
  const question = await questionService.setQuestionStatus({ questionId: req.params.questionId, status });
  sendResponse(res, 200, "Question status updated", { question });
});

export const getQuestions = asyncHandler(async (req, res) => {
  const { status, includeArchived } = req.query;
  const questions = await questionService.getSessionQuestions({
    sessionId: req.params.sessionId,
    status,
    includeArchived: includeArchived === "true",
  });
  sendResponse(res, 200, "Questions fetched", { questions });
});

export const getQuestionStats = asyncHandler(async (req, res) => {
  const stats = await questionService.getQuestionStats(req.params.sessionId);
  sendResponse(res, 200, "Question stats", stats);
});
