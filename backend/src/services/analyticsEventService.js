import AnalyticsEvent from "../models/AnalyticsEvent.js";

export const trackEvent = async ({
  event,
  userId,
  properties = {},
  source = "web",
  ip,
  userAgent,
  sessionId,
  trackId,
  moduleId,
  lessonId,
  projectSubmissionId,
}) => {
  return AnalyticsEvent.create({
    event,
    user: userId,
    properties,
    source,
    ip,
    userAgent,
    sessionId,
    trackId,
    moduleId,
    lessonId,
    projectSubmissionId,
  });
};

export const getUserEventSummary = async (userId, days = 30) => {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  return AnalyticsEvent.aggregate([
    { $match: { user: userId, createdAt: { $gte: since } } },
    {
      $group: {
        _id: "$event",
        count: { $sum: 1 },
        lastAt: { $max: "$createdAt" },
      },
    },
    { $sort: { count: -1 } },
  ]);
};

export const getEventTrends = async (days = 30, eventFilter) => {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const match = { createdAt: { $gte: since } };
  if (eventFilter) match.event = eventFilter;

  return AnalyticsEvent.aggregate([
    { $match: match },
    {
      $group: {
        _id: {
          date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          event: "$event",
        },
        count: { $sum: 1 },
      },
    },
    { $sort: { "_id.date": 1 } },
  ]);
};

export const getPlatformEventSummary = async (days = 7) => {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  return AnalyticsEvent.aggregate([
    { $match: { createdAt: { $gte: since } } },
    {
      $group: {
        _id: "$event",
        count: { $sum: 1 },
        uniqueUsers: { $addToSet: "$user" },
      },
    },
    { $project: { count: 1, uniqueUsers: { $size: "$uniqueUsers" } } },
    { $sort: { count: -1 } },
  ]);
};
