import asyncHandler from "../utils/asyncHandler.js";
import { sendResponse } from "../utils/apiResponse.js";
import ApiError from "../utils/ApiError.js";
import MentorApplication from "../models/MentorApplication.js";
import User from "../models/User.js";
import AdminActivityLog from "../models/AdminActivityLog.js";
import Session from "../models/Session.js";
import { getPagination } from "../utils/pagination.js";
import { ROLES, USER_STATUS, MENTOR_STATUS, MENTOR_ACCOUNT_STATUS, APPLICATION_STATUS } from "../config/permissions.js";
import {
  notifyMentorRejected,
  notifyMentorChangesRequested,
  notifyMentorReviewStarted,
  notifyUser,
  notifyAccountSuspended,
  notifyAccountUnsuspended,
  notifyPasswordReset,
  notifyCredentialsSent,
} from "../services/notificationService.js";
import { provisionOnApproval, regenerateCredentials } from "../services/mentorProvisioningService.js";
import { deliverCredentials, resendCredentials as resendCreds } from "../services/credentialDeliveryService.js";
import { serializeAuthUser } from "../utils/serializeUser.js";
import {
  sendMentorRejectedEmail,
  sendMentorChangesRequestedEmail,
  sendAccountSuspendedEmail,
  sendPasswordResetByAdminEmail,
} from "../services/emailService.js";
import { buildLoginUrl } from "../services/credentialDeliveryService.js";

const QUEUE_MAP = {
  pending: "pending_review",
  approved: "approved",
  rejected: "rejected",
  "changes-requested": "changes_requested",
  archived: "archived",
};

const logAction = async (payload) => {
  try {
    await AdminActivityLog.create(payload);
  } catch {
    // non-blocking
  }
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

  if (track) filter.expertise = { $in: [track] };
  if (expertise) filter.expertise = { $in: [expertise] };

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

async function getLinkedUser(application) {
  if (application.userId) {
    return User.findById(application.userId);
  }
  return User.findOne({ email: application.email.toLowerCase() });
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
    MentorApplication.countDocuments({ status: APPLICATION_STATUS.PENDING_REVIEW }),
    MentorApplication.countDocuments({ status: APPLICATION_STATUS.APPROVED }),
    MentorApplication.countDocuments({ status: APPLICATION_STATUS.REJECTED }),
    MentorApplication.countDocuments({ status: APPLICATION_STATUS.CHANGES_REQUESTED }),
    MentorApplication.countDocuments({ status: APPLICATION_STATUS.ARCHIVED }),
  ]);

  sendResponse(res, 200, "Queue stats", {
    stats: { pendingReview, approved, rejected, changesRequested, archived },
  });
});

export const getApplicationDetail = asyncHandler(async (req, res) => {
  const application = await MentorApplication.findById(req.params.id).lean();
  if (!application) throw new ApiError(404, "Application not found");

  const user = await getLinkedUser(application);
  let sessions = [];
  let studentsCount = 0;

  if (user) {
    sessions = await Session.find({ mentor: user._id })
      .sort({ scheduledAt: -1 })
      .limit(10)
      .select("title scheduledAt status")
      .lean();
    studentsCount = user.linkedStudents?.length ?? 0;
  }

  sendResponse(res, 200, "Application detail fetched", {
    application,
    user: user ? serializeAuthUser(user) : null,
    teaching: { sessions, studentsCount, totalSessions: user?.totalSessions ?? 0 },
    credentialsStatus: {
      sentAt: application.credentialsSentAt,
      deliveryMethod: application.credentialsDeliveryMethod,
      provisionedAt: application.provisionedAt,
    },
  });
});

export const getApplicationAuditLog = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = {
    resource: "mentor_application",
    resourceId: req.params.id,
  };

  const [logs, total] = await Promise.all([
    AdminActivityLog.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("actor", "fullName email")
      .lean(),
    AdminActivityLog.countDocuments(filter),
  ]);

  sendResponse(res, 200, "Audit log fetched", {
    logs,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
});

export const startReview = asyncHandler(async (req, res) => {
  const application = await MentorApplication.findById(req.params.id);
  if (!application) throw new ApiError(404, "Application not found");
  if (application.status !== APPLICATION_STATUS.PENDING_REVIEW) {
    throw new ApiError(400, "Only pending applications can be marked as under review");
  }

  application.reviewStartedAt = new Date();
  application.reviewStartedBy = req.user._id;
  await application.save();

  const user = await getLinkedUser(application);
  if (user) {
    await notifyMentorReviewStarted({ userId: user._id });
  }

  await logAction({
    actor: req.user._id,
    action: "mentor_application.review_started",
    resource: "mentor_application",
    resourceId: application._id,
    targetUser: user?._id,
    metadata: { email: application.email },
    ip: req.ip,
    userAgent: req.headers["user-agent"],
  });

  sendResponse(res, 200, "Review started", { application: application.toObject() });
});

export const approveApplication = asyncHandler(async (req, res) => {
  const application = await MentorApplication.findById(req.params.id);
  if (!application) throw new ApiError(404, "Application not found");
  if (
    application.status !== APPLICATION_STATUS.PENDING_REVIEW &&
    application.status !== APPLICATION_STATUS.CHANGES_REQUESTED
  ) {
    throw new ApiError(400, "Only pending or changes-requested applications can be approved");
  }

  const before = application.toObject();
  application.status = APPLICATION_STATUS.APPROVED;
  application.reviewedBy = req.user._id;
  application.reviewedAt = new Date();
  if (req.body.reviewNotes) {
    application.reviewNotes = req.body.reviewNotes;
  }
  await application.save();

  const provisioning = await provisionOnApproval({
    application,
    actorId: req.user._id,
  });

  let delivery = null;
  if (!provisioning.alreadyProvisioned) {
    delivery = await deliverCredentials({
      user: provisioning.user,
      application,
      actorId: req.user._id,
      tempPassword: provisioning.tempPassword,
    });
  }

  const admins = await User.find({ role: { $in: ["admin", "super_admin"] } }, { _id: 1 });
  for (const admin of admins) {
    await notifyUser({
      recipientId: admin._id,
      type: "mentor",
      message: `${application.fullName} has been approved as a mentor`,
      link: "/admin/moderation",
    }).catch(() => undefined);
  }

  await logAction({
    actor: req.user._id,
    action: "mentor_application.approved",
    resource: "mentor_application",
    resourceId: application._id,
    targetUser: provisioning.user._id,
    before: { status: before.status, mentorAccountStatus: provisioning.user.mentorAccountStatus },
    after: {
      status: APPLICATION_STATUS.APPROVED,
      accountCreated: provisioning.accountCreated,
      roleUpgraded: provisioning.roleUpgraded,
      deliveryMethod: delivery?.deliveryMethod,
    },
    metadata: { email: application.email, fullName: application.fullName },
    ip: req.ip,
    userAgent: req.headers["user-agent"],
  });

  if (delivery) {
    await logAction({
      actor: req.user._id,
      action: "mentor.credentials_sent",
      resource: "mentor_application",
      resourceId: application._id,
      targetUser: provisioning.user._id,
      metadata: { deliveryMethod: delivery.deliveryMethod, emailSent: delivery.emailSent },
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    });
  }

  sendResponse(res, 200, "Application approved", {
    application: application.toObject(),
    user: serializeAuthUser(provisioning.user),
    provisioning: {
      accountCreated: provisioning.accountCreated,
      roleUpgraded: provisioning.roleUpgraded,
      alreadyProvisioned: provisioning.alreadyProvisioned,
      delivery,
    },
  });
});

export const provisionApplication = asyncHandler(async (req, res) => {
  const application = await MentorApplication.findById(req.params.id);
  if (!application) throw new ApiError(404, "Application not found");
  if (application.status !== APPLICATION_STATUS.APPROVED) {
    throw new ApiError(400, "Application must be approved before provisioning");
  }

  const existing = await getLinkedUser(application);
  if (existing?.role === "mentor" && existing.mentorStatus === MENTOR_STATUS.APPROVED) {
    throw new ApiError(409, "Mentor account already provisioned");
  }

  const provisioning = await provisionOnApproval({ application, actorId: req.user._id });
  const delivery = await deliverCredentials({
    user: provisioning.user,
    application,
    actorId: req.user._id,
    tempPassword: provisioning.tempPassword,
  });

  await logAction({
    actor: req.user._id,
    action: "mentor_application.provisioned",
    resource: "mentor_application",
    resourceId: application._id,
    targetUser: provisioning.user._id,
    metadata: { accountCreated: provisioning.accountCreated, roleUpgraded: provisioning.roleUpgraded },
    ip: req.ip,
    userAgent: req.headers["user-agent"],
  });

  sendResponse(res, 200, "Account provisioned", {
    user: serializeAuthUser(provisioning.user),
    provisioning: { ...provisioning, delivery },
  });
});

export const resendApplicationCredentials = asyncHandler(async (req, res) => {
  const application = await MentorApplication.findById(req.params.id);
  if (!application) throw new ApiError(404, "Application not found");

  const user = await getLinkedUser(application);
  if (!user) throw new ApiError(404, "No linked user account found");

  const delivery = await resendCreds({ user, application, actorId: req.user._id });
  await notifyCredentialsSent({ userId: user._id, link: delivery.activationUrl || buildLoginUrl() }).catch(
    () => undefined,
  );

  await logAction({
    actor: req.user._id,
    action: "mentor.credentials_generated",
    resource: "mentor_application",
    resourceId: application._id,
    targetUser: user._id,
    metadata: { deliveryMethod: delivery.deliveryMethod },
    ip: req.ip,
    userAgent: req.headers["user-agent"],
  });

  sendResponse(res, 200, "Credentials resent", { delivery });
});

export const resetApplicationPassword = asyncHandler(async (req, res) => {
  const application = await MentorApplication.findById(req.params.id);
  if (!application) throw new ApiError(404, "Application not found");

  const user = await getLinkedUser(application);
  if (!user) throw new ApiError(404, "No linked user account found");

  const { activationToken } = await regenerateCredentials(user._id, req.user._id);
  const delivery = await resendCreds({ user, application, actorId: req.user._id });
  await sendPasswordResetByAdminEmail({
    to: user.email,
    fullName: user.fullName,
    loginUrl: buildLoginUrl(),
  }).catch(() => undefined);
  await notifyPasswordReset({ userId: user._id }).catch(() => undefined);

  await logAction({
    actor: req.user._id,
    action: "mentor.password_reset",
    resource: "mentor_application",
    resourceId: application._id,
    targetUser: user._id,
    ip: req.ip,
    userAgent: req.headers["user-agent"],
  });

  const payload = { delivery };
  if (process.env.NODE_ENV !== "production") {
    payload.devActivationToken = activationToken;
  }
  sendResponse(res, 200, "Password reset successfully", payload);
});

export const archiveApplication = asyncHandler(async (req, res) => {
  const application = await MentorApplication.findById(req.params.id);
  if (!application) throw new ApiError(404, "Application not found");

  const before = application.status;
  application.status = APPLICATION_STATUS.ARCHIVED;
  await application.save();

  const user = await getLinkedUser(application);
  if (user?.mentorAccountStatus) {
    user.mentorAccountStatus = MENTOR_ACCOUNT_STATUS.ARCHIVED;
    await user.save();
  }

  await logAction({
    actor: req.user._id,
    action: "mentor_application.archived",
    resource: "mentor_application",
    resourceId: application._id,
    targetUser: user?._id,
    before: { status: before },
    after: { status: APPLICATION_STATUS.ARCHIVED },
    ip: req.ip,
    userAgent: req.headers["user-agent"],
  });

  sendResponse(res, 200, "Application archived", { application: application.toObject() });
});

export const suspendMentor = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  const application = await MentorApplication.findById(req.params.id);
  if (!application) throw new ApiError(404, "Application not found");

  const user = await getLinkedUser(application);
  if (!user) throw new ApiError(404, "No linked user account found");

  const before = user.mentorAccountStatus;
  user.mentorAccountStatus = MENTOR_ACCOUNT_STATUS.SUSPENDED;
  user.status = USER_STATUS.SUSPENDED;
  user.statusReason = reason;
  user.statusChangedAt = new Date();
  user.statusChangedBy = req.user._id;
  user.refreshTokenHash = undefined;
  user.refreshTokenExpiresAt = undefined;
  await user.save();

  await notifyAccountSuspended({ userId: user._id, reason });
  await sendAccountSuspendedEmail({
    to: user.email,
    fullName: user.fullName,
    reason: reason || undefined,
  }).catch(() => undefined);

  await logAction({
    actor: req.user._id,
    action: "mentor.suspended",
    resource: "mentor_application",
    resourceId: application._id,
    targetUser: user._id,
    before: { mentorAccountStatus: before },
    after: { mentorAccountStatus: MENTOR_ACCOUNT_STATUS.SUSPENDED },
    metadata: { reason },
    ip: req.ip,
    userAgent: req.headers["user-agent"],
  });

  sendResponse(res, 200, "Mentor suspended", { user: serializeAuthUser(user) });
});

export const reactivateMentor = asyncHandler(async (req, res) => {
  const application = await MentorApplication.findById(req.params.id);
  if (!application) throw new ApiError(404, "Application not found");

  const user = await getLinkedUser(application);
  if (!user) throw new ApiError(404, "No linked user account found");

  const before = user.mentorAccountStatus;
  user.mentorAccountStatus = user.onboardingCompletedAt
    ? MENTOR_ACCOUNT_STATUS.ACTIVE
    : MENTOR_ACCOUNT_STATUS.ACTIVATED;
  user.status = USER_STATUS.ACTIVE;
  user.statusReason = undefined;
  user.statusChangedAt = new Date();
  user.statusChangedBy = req.user._id;
  await user.save();

  await notifyAccountUnsuspended({ userId: user._id });

  await logAction({
    actor: req.user._id,
    action: "mentor.reactivated",
    resource: "mentor_application",
    resourceId: application._id,
    targetUser: user._id,
    before: { mentorAccountStatus: before },
    after: { mentorAccountStatus: user.mentorAccountStatus },
    ip: req.ip,
    userAgent: req.headers["user-agent"],
  });

  sendResponse(res, 200, "Mentor reactivated", { user: serializeAuthUser(user) });
});

export const deactivateMentor = asyncHandler(async (req, res) => {
  const application = await MentorApplication.findById(req.params.id);
  if (!application) throw new ApiError(404, "Application not found");

  const user = await getLinkedUser(application);
  if (!user) throw new ApiError(404, "No linked user account found");

  const before = user.mentorAccountStatus;
  user.mentorAccountStatus = MENTOR_ACCOUNT_STATUS.DISABLED;
  user.status = USER_STATUS.INACTIVE;
  user.statusChangedAt = new Date();
  user.statusChangedBy = req.user._id;
  user.refreshTokenHash = undefined;
  user.refreshTokenExpiresAt = undefined;
  await user.save();

  await logAction({
    actor: req.user._id,
    action: "mentor.deactivated",
    resource: "mentor_application",
    resourceId: application._id,
    targetUser: user._id,
    before: { mentorAccountStatus: before },
    after: { mentorAccountStatus: MENTOR_ACCOUNT_STATUS.DISABLED },
    ip: req.ip,
    userAgent: req.headers["user-agent"],
  });

  sendResponse(res, 200, "Mentor deactivated", { user: serializeAuthUser(user) });
});

export const removeMentorRole = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  const application = await MentorApplication.findById(req.params.id);
  if (!application) throw new ApiError(404, "Application not found");

  const user = await getLinkedUser(application);
  if (!user) throw new ApiError(404, "No linked user account found");

  const beforeRole = user.role;
  user.role = ROLES.STUDENT;
  user.mentorStatus = MENTOR_STATUS.ARCHIVED;
  user.mentorAccountStatus = MENTOR_ACCOUNT_STATUS.ARCHIVED;
  user.isVerified = false;
  user.refreshTokenHash = undefined;
  user.refreshTokenExpiresAt = undefined;
  await user.save();

  await logAction({
    actor: req.user._id,
    action: "mentor.role_removed",
    resource: "mentor_application",
    resourceId: application._id,
    targetUser: user._id,
    before: { role: beforeRole },
    after: { role: ROLES.STUDENT },
    metadata: { reason },
    ip: req.ip,
    userAgent: req.headers["user-agent"],
  });

  sendResponse(res, 200, "Mentor role removed", { user: serializeAuthUser(user) });
});

export const rejectApplication = asyncHandler(async (req, res) => {
  const { rejectionReason } = req.body;
  if (!rejectionReason?.trim()) {
    throw new ApiError(400, "Rejection reason is required");
  }

  const application = await MentorApplication.findById(req.params.id);
  if (!application) throw new ApiError(404, "Application not found");
  if (
    application.status !== APPLICATION_STATUS.PENDING_REVIEW &&
    application.status !== APPLICATION_STATUS.CHANGES_REQUESTED
  ) {
    throw new ApiError(400, "Only pending or changes-requested applications can be rejected");
  }

  const before = application.toObject();
  application.status = APPLICATION_STATUS.REJECTED;
  application.rejectionReason = rejectionReason.trim();
  application.reviewedBy = req.user._id;
  application.reviewedAt = new Date();
  application.rejectionHistory.push({
    reason: rejectionReason.trim(),
    reviewedBy: req.user._id,
    reviewedAt: new Date(),
  });
  await application.save();

  const existingUser = await getLinkedUser(application);
  if (existingUser) {
    existingUser.mentorStatus = MENTOR_STATUS.REJECTED;
    existingUser.mentorAccountStatus = MENTOR_ACCOUNT_STATUS.REJECTED;
    existingUser.isVerified = false;
    if (existingUser.role !== "mentor") {
      existingUser.status = USER_STATUS.REJECTED;
    }
    existingUser.statusChangedAt = new Date();
    existingUser.statusChangedBy = req.user._id;
    await existingUser.save();
    await notifyMentorRejected({ userId: existingUser._id, reason: rejectionReason.trim() });
  }

  await sendMentorRejectedEmail({
    to: application.email,
    fullName: application.fullName,
    reason: rejectionReason.trim(),
  }).catch(() => undefined);

  await logAction({
    actor: req.user._id,
    action: "mentor_application.rejected",
    resource: "mentor_application",
    resourceId: application._id,
    targetUser: existingUser?._id,
    before: { status: before.status },
    after: { status: APPLICATION_STATUS.REJECTED, rejectionReason: rejectionReason.trim() },
    metadata: { email: application.email, fullName: application.fullName },
    ip: req.ip,
    userAgent: req.headers["user-agent"],
  });

  sendResponse(res, 200, "Application rejected", { application: application.toObject() });
});

export const requestChanges = asyncHandler(async (req, res) => {
  const { reviewNotes } = req.body;
  if (!reviewNotes?.trim()) {
    throw new ApiError(400, "Review notes are required when requesting changes");
  }

  const application = await MentorApplication.findById(req.params.id);
  if (!application) throw new ApiError(404, "Application not found");
  if (application.status !== APPLICATION_STATUS.PENDING_REVIEW) {
    throw new ApiError(400, "Only pending applications can have changes requested");
  }

  const before = application.toObject();
  application.status = APPLICATION_STATUS.CHANGES_REQUESTED;
  application.reviewNotes = reviewNotes.trim();
  application.reviewedBy = req.user._id;
  application.reviewedAt = new Date();
  await application.save();

  const existingUser = await getLinkedUser(application);
  if (existingUser) {
    existingUser.mentorStatus = MENTOR_STATUS.CHANGES_REQUESTED;
    existingUser.status = USER_STATUS.PENDING;
    existingUser.statusChangedAt = new Date();
    existingUser.statusChangedBy = req.user._id;
    await existingUser.save();
    await notifyMentorChangesRequested({ userId: existingUser._id, notes: reviewNotes.trim() });
  }

  await sendMentorChangesRequestedEmail({
    to: application.email,
    fullName: application.fullName,
    notes: reviewNotes.trim(),
  }).catch(() => undefined);

  await logAction({
    actor: req.user._id,
    action: "mentor_application.changes_requested",
    resource: "mentor_application",
    resourceId: application._id,
    targetUser: existingUser?._id,
    before: { status: before.status },
    after: { status: APPLICATION_STATUS.CHANGES_REQUESTED, reviewNotes: reviewNotes.trim() },
    metadata: { email: application.email, fullName: application.fullName },
    ip: req.ip,
    userAgent: req.headers["user-agent"],
  });

  sendResponse(res, 200, "Changes requested", { application: application.toObject() });
});

export const getLoginHistory = asyncHandler(async (req, res) => {
  const application = await MentorApplication.findById(req.params.id);
  if (!application) throw new ApiError(404, "Application not found");

  const user = await getLinkedUser(application);
  if (!user) throw new ApiError(404, "No linked user account found");

  sendResponse(res, 200, "Login history fetched", {
    lastLoginAt: user.lastLoginAt,
    lastLoginIp: user.lastLoginIp,
    devices: user.devices ?? [],
    activeSessions: user.activeSessions ?? 0,
  });
});
