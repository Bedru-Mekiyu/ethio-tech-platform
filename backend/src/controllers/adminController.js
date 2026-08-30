import asyncHandler from "../utils/asyncHandler.js";
import { sendResponse } from "../utils/apiResponse.js";
import User from "../models/User.js";
import Session from "../models/Session.js";
import Hub from "../models/Hub.js";
import XPLog from "../models/XPLog.js";
import Submission from "../models/Submission.js";
import MentorApplication from "../models/MentorApplication.js";
import ApiError from "../utils/ApiError.js";
import { getPagination } from "../utils/pagination.js";
import { notifyUser } from "../services/notificationService.js";
import AdminActivityLog from "../models/AdminActivityLog.js";

export const getAnalytics = asyncHandler(async (_req, res) => {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const now = new Date();

  const [
    totalStudents,
    activeLearners,
    mentorCount,
    xpLast30Days,
    upcomingSessions,
    hubs,
    topMentors,
    xpByTrack,
    usersByStatus,
  ] = await Promise.all([
    User.countDocuments({ role: "student", deletedAt: null }),
    User.countDocuments({ role: "student", updatedAt: { $gte: sevenDaysAgo }, deletedAt: null }),
    User.countDocuments({ role: "mentor", deletedAt: null }),
    XPLog.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
    Session.find({
      scheduledAt: { $gte: now },
      status: { $in: ["scheduled", "live"] },
    })
      .select("title scheduledAt participants status")
      .sort({ scheduledAt: 1 })
      .limit(20),
    Hub.find({ isActive: true }).select("city address capacity computersAvailable mentorInCharge"),
    User.find({ role: "mentor", deletedAt: null })
      .sort({ mentorScore: -1 })
      .limit(5)
      .select("fullName mentorScore totalSessions"),
    XPLog.aggregate([
      { $match: { sourceType: "lesson" } },
      {
        $lookup: {
          from: "lessons",
          localField: "sourceId",
          foreignField: "_id",
          as: "lesson",
        },
      },
      { $unwind: "$lesson" },
      {
        $lookup: {
          from: "modules",
          localField: "lesson.module",
          foreignField: "_id",
          as: "module",
        },
      },
      { $unwind: "$module" },
      {
        $group: {
          _id: "$module.track",
          xpTotal: { $sum: "$amount" },
        },
      },
      {
        $lookup: {
          from: "tracks",
          localField: "_id",
          foreignField: "_id",
          as: "track",
        },
      },
      { $unwind: { path: "$track", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          title: "$track.title",
          category: "$track.category",
          xpTotal: 1,
        },
      },
      { $sort: { xpTotal: -1 } },
      { $limit: 4 },
    ]),
    User.aggregate([{ $match: { deletedAt: null } }, { $group: { _id: "$status", count: { $sum: 1 } } }]),
  ]);

  const sessionFillRate =
    upcomingSessions.length === 0
      ? 0
      : Math.round((upcomingSessions.filter((s) => s.participants?.length > 0).length / upcomingSessions.length) * 100);

  const hubsWithAvailability = hubs.map((hub) => ({
    ...hub.toObject(),
    name: hub.city,
    availableSeats: hub.capacity ?? null,
  }));

  sendResponse(res, 200, "Admin analytics", {
    metrics: {
      activeLearners,
      totalStudents,
      mentorNetwork: mentorCount,
      xpEarned30d: xpLast30Days[0]?.total ?? 0,
      sessionFillRate,
    },
    usersByStatus: usersByStatus.reduce((acc, s) => ({ ...acc, [s._id]: s.count }), {}),
    topMentors,
    xpByTrack,
    hubs: hubsWithAvailability,
    upcomingSessions,
  });
});

export const getAuditLogs = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const { action, resource, userId } = req.query;

  const filter = {};
  if (action) filter.action = action;
  if (resource) filter.resource = resource;
  if (userId) filter.targetUser = userId;

  const [logs, total] = await Promise.all([
    AdminActivityLog.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("actor", "fullName email role")
      .populate("targetUser", "fullName email role"),
    AdminActivityLog.countDocuments(filter),
  ]);

  sendResponse(res, 200, "Audit logs fetched", {
    logs,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

export const getModerationQueue = asyncHandler(async (_req, res) => {
  const submissions = await Submission.find({ $or: [{ flagged: true }, { status: "pending" }] })
    .sort({ updatedAt: -1 })
    .limit(50)
    .populate("student", "fullName")
    .populate("project", "title");
  sendResponse(res, 200, "Moderation queue fetched", { submissions });
});

export const flagSubmission = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  const submission = await Submission.findByIdAndUpdate(
    req.params.id,
    { flagged: true, flagReason: reason || "Flagged by admin" },
    { new: true },
  ).populate("student", "fullName");
  if (!submission) throw new ApiError(404, "Submission not found");

  if (submission.student?._id) {
    await notifyUser({
      recipientId: submission.student._id,
      type: "system",
      message: `Your submission has been flagged${reason ? `: ${reason}` : ""}. Please review and resubmit if needed.`,
      link: "/app/projects",
      createdBy: req.user._id,
    });
  }

  sendResponse(res, 200, "Submission flagged", { submission });
});

export const getMentorApplications = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const { status } = req.query;

  const filter = {};
  if (status) filter.status = status;

  const [applications, total] = await Promise.all([
    MentorApplication.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    MentorApplication.countDocuments(filter),
  ]);

  sendResponse(res, 200, "Mentor applications fetched", {
    applications,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
});
