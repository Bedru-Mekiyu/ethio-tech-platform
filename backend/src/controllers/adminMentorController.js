import asyncHandler from "../utils/asyncHandler.js";
import { sendResponse } from "../utils/apiResponse.js";
import ApiError from "../utils/ApiError.js";
import MentorApplication from "../models/MentorApplication.js";
import User from "../models/User.js";
import AdminActivityLog from "../models/AdminActivityLog.js";
import { getPagination } from "../utils/pagination.js";
import { USER_STATUS, MENTOR_STATUS } from "../config/permissions.js";
import { notifyMentorApproved, notifyMentorRejected, notifyMentorChangesRequested, notifyUser } from "../services/notificationService.js";

const QUEUE_MAP = {
  pending: "pending_review",
  approved: "approved",
  rejected: "rejected",
  "changes-requested": "changes_requested",
  archived: "archived",
};

function buildFilter(status, query) {
  const filter = { status };
  const { search, dateFrom, dateTo, track, expertise, experienceMin, experienceMax } = query;

  if (search) {
    const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    filter.$or = [
      { fullName: { $regex: escaped, $options: "i" } },
      { email: { $regex: escaped, $options: "i" } },
      { currentRole: { $regex: escaped, $options: "i" } },
      { currentCompany: { $regex: escaped, $options: "i" } },
    ];
  }

  if (dateFrom || dateTo) {
    filter.createdAt = {};
    if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
    if (dateTo) filter.createdAt.$lte = new Date(dateTo);
  }

  if (track) {
    filter.expertise = { $in: [track] };
  }

  if (expertise) {
    filter.expertise = { $in: [expertise] };
  }

  if (experienceMin !== undefined || experienceMax !== undefined) {
    filter.yearsExperience = {};
    if (experienceMin !== undefined) filter.yearsExperience.$gte = Number(experienceMin);
    if (experienceMax !== undefined) filter.yearsExperience.$lte = Number(experienceMax);
  }

  return filter;
}

function getSort(query) {
  const { sortBy = "createdAt", sortOrder = "desc" } = query;
  return { [sortBy]: sortOrder === "asc" ? 1 : -1 };
}

export const getQueueApplications = (statusKey) =>
  asyncHandler(async (req, res) => {
    const status = QUEUE_MAP[statusKey];
    const { page, limit, skip } = getPagination(req.query);
    const filter = buildFilter(status, req.query);
    const sort = getSort(req.query);

    const [applications, total] = await Promise.all([
      MentorApplication.find(filter).sort(sort).skip(skip).limit(limit).lean(),
      MentorApplication.countDocuments(filter),
    ]);

    sendResponse(res, 200, `${statusKey} applications fetched`, {
      applications,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  });

export const getQueueStats = asyncHandler(async (_req, res) => {
  const [pendingReview, approved, rejected, changesRequested, archived] = await Promise.all([
    MentorApplication.countDocuments({ status: "pending_review" }),
    MentorApplication.countDocuments({ status: "approved" }),
    MentorApplication.countDocuments({ status: "rejected" }),
    MentorApplication.countDocuments({ status: "changes_requested" }),
    MentorApplication.countDocuments({ status: "archived" }),
  ]);

  sendResponse(res, 200, "Queue stats", {
    stats: { pendingReview, approved, rejected, changesRequested, archived },
  });
});

export const approveApplication = asyncHandler(async (req, res) => {
  const application = await MentorApplication.findById(req.params.id);
  if (!application) throw new ApiError(404, "Application not found");
  if (application.status !== "pending_review" && application.status !== "changes_requested") {
    throw new ApiError(400, "Only pending or changes-requested applications can be approved");
  }

  const before = application.toObject();
  application.status = "approved";
  application.reviewedBy = req.user._id;
  application.reviewedAt = new Date();
  application.reviewedNotes = req.body.reviewNotes || application.reviewedNotes;
  await application.save();

  const existingUser = await User.findOne({ email: application.email.toLowerCase() });
  if (existingUser) {
    existingUser.mentorStatus = MENTOR_STATUS.APPROVED;
    existingUser.isVerified = true;
    existingUser.verifiedAt = new Date();
    existingUser.verifiedBy = req.user._id;
    existingUser.status = USER_STATUS.ACTIVE;
    existingUser.statusChangedAt = new Date();
    existingUser.statusChangedBy = req.user._id;
    existingUser.expertise = application.expertise ?? [];
    existingUser.currentCompany = application.currentCompany;
    existingUser.bio = application.whyMentor;
    await existingUser.save();
  }

  const admins = await User.find(
    { role: { $in: ["admin", "super_admin"] } },
    { _id: 1 }
  );

  for (const admin of admins) {
    await notifyUser({
      recipientId: admin._id,
      type: "mentor",
      message: `${application.fullName} has been approved as a mentor`,
      link: "/admin/moderation",
    }).catch(() => undefined);
  }

  if (existingUser) {
    await notifyMentorApproved({ userId: existingUser._id });
  }

  await AdminActivityLog.create({
    actor: req.user._id,
    action: "mentor_application.approved",
    resource: "mentor_application",
    resourceId: application._id,
    targetUser: existingUser?._id,
    before: { status: before.status },
    after: { status: "approved" },
    metadata: { email: application.email, fullName: application.fullName },
    ip: req.ip,
    userAgent: req.headers["user-agent"],
  });

  sendResponse(res, 200, "Application approved", { application: application.toObject() });
});

export const rejectApplication = asyncHandler(async (req, res) => {
  const { rejectionReason } = req.body;
  if (!rejectionReason || !rejectionReason.trim()) {
    throw new ApiError(400, "Rejection reason is required");
  }

  const application = await MentorApplication.findById(req.params.id);
  if (!application) throw new ApiError(404, "Application not found");
  if (application.status !== "pending_review" && application.status !== "changes_requested") {
    throw new ApiError(400, "Only pending or changes-requested applications can be rejected");
  }

  const before = application.toObject();
  application.status = "rejected";
  application.rejectionReason = rejectionReason.trim();
  application.reviewedBy = req.user._id;
  application.reviewedAt = new Date();
  application.rejectionHistory.push({
    reason: rejectionReason.trim(),
    reviewedBy: req.user._id,
    reviewedAt: new Date(),
  });
  await application.save();

  const existingUser = await User.findOne({ email: application.email.toLowerCase() });
  if (existingUser) {
    existingUser.mentorStatus = MENTOR_STATUS.REJECTED;
    existingUser.isVerified = false;
    existingUser.status = USER_STATUS.REJECTED;
    existingUser.statusChangedAt = new Date();
    existingUser.statusChangedBy = req.user._id;
    await existingUser.save();
    await notifyMentorRejected({ userId: existingUser._id, reason: rejectionReason.trim() });
  }

  await AdminActivityLog.create({
    actor: req.user._id,
    action: "mentor_application.rejected",
    resource: "mentor_application",
    resourceId: application._id,
    targetUser: existingUser?._id,
    before: { status: before.status },
    after: { status: "rejected", rejectionReason: rejectionReason.trim() },
    metadata: { email: application.email, fullName: application.fullName },
    ip: req.ip,
    userAgent: req.headers["user-agent"],
  });

  sendResponse(res, 200, "Application rejected", { application: application.toObject() });
});

export const requestChanges = asyncHandler(async (req, res) => {
  const { reviewNotes } = req.body;
  if (!reviewNotes || !reviewNotes.trim()) {
    throw new ApiError(400, "Review notes are required when requesting changes");
  }

  const application = await MentorApplication.findById(req.params.id);
  if (!application) throw new ApiError(404, "Application not found");
  if (application.status !== "pending_review") {
    throw new ApiError(400, "Only pending applications can have changes requested");
  }

  const before = application.toObject();
  application.status = "changes_requested";
  application.reviewNotes = reviewNotes.trim();
  application.reviewedBy = req.user._id;
  application.reviewedAt = new Date();
  await application.save();

  const existingUser = await User.findOne({ email: application.email.toLowerCase() });
  if (existingUser) {
    existingUser.mentorStatus = MENTOR_STATUS.CHANGES_REQUESTED;
    existingUser.status = USER_STATUS.PENDING;
    existingUser.statusChangedAt = new Date();
    existingUser.statusChangedBy = req.user._id;
    await existingUser.save();
    await notifyMentorChangesRequested({ userId: existingUser._id, notes: reviewNotes.trim() });
  }

  await AdminActivityLog.create({
    actor: req.user._id,
    action: "mentor_application.changes_requested",
    resource: "mentor_application",
    resourceId: application._id,
    targetUser: existingUser?._id,
    before: { status: before.status },
    after: { status: "changes_requested", reviewNotes: reviewNotes.trim() },
    metadata: { email: application.email, fullName: application.fullName },
    ip: req.ip,
    userAgent: req.headers["user-agent"],
  });

  sendResponse(res, 200, "Changes requested", { application: application.toObject() });
});
