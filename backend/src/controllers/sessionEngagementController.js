import asyncHandler from "../utils/asyncHandler.js";
import { sendResponse } from "../utils/apiResponse.js";
import * as engagementService from "../services/engagementService.js";

export const calculateEngagement = asyncHandler(async (req, res) => {
  const result = await engagementService.calculateEngagementScore({
    sessionId: req.params.sessionId,
    userId: req.params.userId || req.user._id,
  });
  sendResponse(res, 200, "Engagement calculated", result);
});

export const getSessionEngagement = asyncHandler(async (req, res) => {
  const scores = await engagementService.getSessionEngagementScores(req.params.sessionId);
  sendResponse(res, 200, "Engagement scores", { scores });
});

export const getEngagementSummary = asyncHandler(async (req, res) => {
  const summary = await engagementService.getSessionEngagementSummary(req.params.sessionId);
  sendResponse(res, 200, "Engagement summary", summary);
});

export const getMyEngagement = asyncHandler(async (req, res) => {
  const result = await engagementService.getStudentEngagement({
    sessionId: req.params.sessionId,
    userId: req.user._id,
  });
  sendResponse(res, 200, "My engagement", result);
});
