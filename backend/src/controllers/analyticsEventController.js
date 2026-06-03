import asyncHandler from "../utils/asyncHandler.js";
import { sendResponse } from "../utils/apiResponse.js";
import {
  trackEvent,
  getUserEventSummary,
  getEventTrends,
  getPlatformEventSummary,
} from "../services/analyticsEventService.js";

export const trackAnalyticsEvent = asyncHandler(async (req, res) => {
  const {
    event,
    properties,
    source,
    sessionId,
    trackId,
    moduleId,
    lessonId,
    projectSubmissionId,
  } = req.body;

  await trackEvent({
    event,
    userId: req.user._id,
    properties,
    source,
    ip: req.ip,
    userAgent: req.get("user-agent"),
    sessionId,
    trackId,
    moduleId,
    lessonId,
    projectSubmissionId,
  });

  sendResponse(res, 201, "Event tracked");
});

export const getMyEventSummary = asyncHandler(async (req, res) => {
  const days = parseInt(req.query.days) || 30;
  const summary = await getUserEventSummary(req.user._id, days);
  sendResponse(res, 200, "Event summary", { summary });
});

export const getEventTrendsData = asyncHandler(async (req, res) => {
  const days = parseInt(req.query.days) || 30;
  const { event } = req.query;
  const trends = await getEventTrends(days, event);
  sendResponse(res, 200, "Event trends", { trends });
});

export const getPlatformEventSummaryData = asyncHandler(async (req, res) => {
  const days = parseInt(req.query.days) || 7;
  const summary = await getPlatformEventSummary(days);
  sendResponse(res, 200, "Platform event summary", { summary });
});
