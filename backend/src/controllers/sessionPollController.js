import asyncHandler from "../utils/asyncHandler.js";
import { sendResponse } from "../utils/apiResponse.js";
import ApiError from "../utils/ApiError.js";
import * as pollService from "../services/sessionPollService.js";

export const createPoll = asyncHandler(async (req, res) => {
  const { question, type, options } = req.body;
  if (!question?.trim()) throw new ApiError(400, "Poll question is required");
  if (!["single", "multiple", "true_false"].includes(type)) {
    throw new ApiError(400, "Type must be single, multiple, or true_false");
  }
  if (type !== "true_false" && (!options || options.length < 2)) {
    throw new ApiError(400, "At least 2 options required");
  }
  const poll = await pollService.createPoll({
    sessionId: req.params.sessionId,
    userId: req.user._id,
    question,
    type,
    options: options || [],
  });
  sendResponse(res, 201, "Poll created", { poll });
});

export const votePoll = asyncHandler(async (req, res) => {
  const { optionIndex, optionIndexes } = req.body;
  if ((optionIndex === undefined || optionIndex === null) && !Array.isArray(optionIndexes)) {
    throw new ApiError(400, "optionIndex or optionIndexes is required");
  }
  const result = await pollService.votePoll({
    pollId: req.params.pollId,
    userId: req.user._id,
    optionIndex,
    optionIndexes,
  });
  sendResponse(res, 200, "Vote recorded", result);
});

export const closePoll = asyncHandler(async (req, res) => {
  const poll = await pollService.closePoll(req.params.pollId);
  sendResponse(res, 200, "Poll closed", { poll });
});

export const reopenPoll = asyncHandler(async (req, res) => {
  const poll = await pollService.reopenPoll(req.params.pollId);
  sendResponse(res, 200, "Poll reopened", { poll });
});

export const publishResults = asyncHandler(async (req, res) => {
  const poll = await pollService.publishResults(req.params.pollId);
  sendResponse(res, 200, "Results published", { poll });
});

export const getPolls = asyncHandler(async (req, res) => {
  const { includeClosed } = req.query;
  const polls = await pollService.getSessionPolls(req.params.sessionId, includeClosed === "true");
  sendResponse(res, 200, "Polls fetched", { polls });
});

export const getPollResults = asyncHandler(async (req, res) => {
  const result = await pollService.getPollResults(req.params.pollId);
  sendResponse(res, 200, "Poll results", result);
});

export const getPollStats = asyncHandler(async (req, res) => {
  const stats = await pollService.getPollStats(req.params.sessionId);
  sendResponse(res, 200, "Poll stats", stats);
});
