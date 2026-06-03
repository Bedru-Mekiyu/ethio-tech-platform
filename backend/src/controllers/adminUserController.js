import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import AdminActivityLog from "../models/AdminActivityLog.js";
import { sendResponse } from "../utils/apiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { getPagination } from "../utils/pagination.js";
import { sanitizeOptionalText } from "../utils/sanitize.js";
import { ROLES, USER_STATUS, DELETION_RETENTION_DAYS } from "../config/permissions.js";
import {
  notifyAccountApproved,
  notifyAccountSuspended,
  notifyAccountUnsuspended,
  notifyAccountBanned,
  notifyAccountDeleted,
  notifyRoleChanged,
  notifyMentorApproved,
  notifyMentorRejected,
  notifyPasswordReset,
  notifyAnnouncement,
} from "../services/notificationService.js";

const SENSITIVE_FIELDS = "-password -refreshTokenHash -refreshTokenExpiresAt -avatarPublicId -passwordResetHash -passwordResetExpiresAt -loginAttempts -lockUntil";

const buildUserFilter = (query) => {
  const filter = { deletedAt: null };
  const { role, status, search, mentorStatus, isVerified, track, dateFrom, dateTo } = query;

  if (role) filter.role = role;
  if (status) filter.status = status;
  if (mentorStatus) filter.mentorStatus = mentorStatus;
  if (isVerified !== undefined) filter.isVerified = isVerified === "true";
  if (track) filter.enrolledTracks = new mongoose.Types.ObjectId(track);

  if (dateFrom || dateTo) {
    filter.createdAt = {};
    if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
    if (dateTo) filter.createdAt.$lte = new Date(dateTo);
  }

  if (search) {
    const searchRegex = { $regex: search, $options: "i" };
    filter.$or = [
      { fullName: searchRegex },
      { email: searchRegex },
      { city: searchRegex },
      { currentCompany: searchRegex },
    ];
  }

  return filter;
};

const buildSort = (sort) => {
  const sortMap = {
    newest: { createdAt: -1 },
    oldest: { createdAt: 1 },
    name_asc: { fullName: 1 },
    name_desc: { fullName: -1 },
    email_asc: { email: 1 },
    email_desc: { email: -1 },
    xp_desc: { xp: -1 },
    xp_asc: { xp: 1 },
    last_login: { lastLoginAt: -1 },
    sessions_desc: { totalSessions: -1 },
    mentor_score: { mentorScore: -1 },
  };
  return sortMap[sort] || { createdAt: -1 };
};

const logAdminAction = async ({ actor, action, resource, resourceId, targetUser, before, after, metadata, ip, userAgent, success = true, errorMessage }) => {
  try {
    return await AdminActivityLog.create({
      actor, action, resource, resourceId, targetUser,
      before, after, metadata, ip, userAgent, success, errorMessage,
    });
  } catch {
    return null;
  }
};

export const getAdminUsers = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = buildUserFilter(req.query);
  const sort = buildSort(req.query.sort);

  const [users, total] = await Promise.all([
    User.find(filter)
      .select(SENSITIVE_FIELDS)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    User.countDocuments(filter),
  ]);

  const items = users.map((user) => ({
    ...user,
    id: user._id?.toString?.() ?? user._id,
    isDeleted: false,
    isActive: user.status === USER_STATUS.ACTIVE,
    isSuspended: user.status === USER_STATUS.SUSPENDED,
  }));

  sendResponse(res, 200, "Users fetched", {
    items,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
});

export const getAdminUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select(SENSITIVE_FIELDS).lean();
  if (!user) throw new ApiError(404, "User not found");

  const stats = await Promise.all([
    User.countDocuments({ linkedStudents: user._id }),
    User.countDocuments({ status: USER_STATUS.ACTIVE, linkedStudents: user._id }),
  ]);

  sendResponse(res, 200, "User fetched", {
    user: {
      ...user,
      id: user._id?.toString?.() ?? user._id,
      linkedStudentCount: stats[0],
      activeLinkedStudents: stats[1],
    },
  });
});

export const createUser = asyncHandler(async (req, res) => {
  const { fullName, email, password, role, gradeLevel, city, bio, phone, expertise, currentCompany, learningInterests } = req.body;

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) throw new ApiError(409, "Email already registered");

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await User.create({
    fullName,
    email,
    password: hashedPassword,
    role: role || ROLES.STUDENT,
    status: USER_STATUS.ACTIVE,
    statusChangedAt: new Date(),
    statusChangedBy: req.user._id,
    gradeLevel,
    city: city?.trim() || undefined,
    bio: sanitizeOptionalText(bio, 1000),
    phone: phone?.trim() || undefined,
    expertise: Array.isArray(expertise) ? expertise.map((e) => e.trim()).filter(Boolean) : undefined,
    currentCompany: currentCompany?.trim() || undefined,
    learningInterests: Array.isArray(learningInterests) ? learningInterests.map((i) => i.trim()).filter(Boolean) : undefined,
    isVerified: true,
    verifiedAt: new Date(),
    verifiedBy: req.user._id,
  });

  await logAdminAction({
    actor: req.user._id,
    action: "user.create",
    resource: "user",
    resourceId: user._id,
    targetUser: user._id,
    after: { fullName: user.fullName, email: user.email, role: user.role },
    ip: req.ip,
    userAgent: req.headers["user-agent"],
  });

  const createdUser = await User.findById(user._id).select(SENSITIVE_FIELDS).lean();
  sendResponse(res, 201, "User created successfully", { user: createdUser });
});

export const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select(SENSITIVE_FIELDS);
  if (!user) throw new ApiError(404, "User not found");
  if (user.deletedAt) throw new ApiError(400, "Cannot update a deleted user");

  const allowedFields = [
    "fullName", "bio", "phone", "city", "gradeLevel",
    "expertise", "currentCompany", "learningInterests",
  ];

  const before = user.toObject();
  const updates = {};

  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      if (field === "bio") updates.bio = sanitizeOptionalText(req.body.bio, 1000);
      else if (field === "fullName") updates.fullName = sanitizeOptionalText(req.body.fullName, 120);
      else if (field === "expertise" || field === "learningInterests") {
        updates[field] = Array.isArray(req.body[field])
          ? req.body[field].map((i) => i.trim()).filter(Boolean)
          : undefined;
      } else {
        updates[field] = req.body[field];
      }
    }
  }

  if (Object.keys(updates).length === 0) {
    throw new ApiError(400, "No valid fields to update");
  }

  const updated = await User.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true })
    .select(SENSITIVE_FIELDS).lean();

  await logAdminAction({
    actor: req.user._id,
    action: "user.edit",
    resource: "user",
    resourceId: user._id,
    targetUser: user._id,
    before: { fullName: before.fullName, bio: before.bio, phone: before.phone, city: before.city },
    after: { fullName: updated.fullName, bio: updated.bio, phone: updated.phone, city: updated.city },
    ip: req.ip,
    userAgent: req.headers["user-agent"],
  });

  sendResponse(res, 200, "User updated successfully", { user: updated });
});

export const changeUserRole = asyncHandler(async (req, res) => {
  const { role } = req.body;
  const user = await User.findById(req.params.id).select(SENSITIVE_FIELDS);
  if (!user) throw new ApiError(404, "User not found");
  if (!Object.values(ROLES).includes(role)) throw new ApiError(400, "Invalid role");

  if (user.role === ROLES.SUPER_ADMIN && req.user.role !== ROLES.SUPER_ADMIN) {
    throw new ApiError(403, "Only super admins can change another super admin's role");
  }

  const beforeRole = user.role;
  user.role = role;
  await user.save();

  await notifyRoleChanged({ userId: user._id, newRole: role });
  await logAdminAction({
    actor: req.user._id,
    action: "user.change_role",
    resource: "user",
    resourceId: user._id,
    targetUser: user._id,
    before: { role: beforeRole },
    after: { role },
    ip: req.ip,
    userAgent: req.headers["user-agent"],
  });

  const updated = await User.findById(user._id).select(SENSITIVE_FIELDS).lean();
  sendResponse(res, 200, "User role updated", { user: updated });
});

export const verifyUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select(SENSITIVE_FIELDS);
  if (!user) throw new ApiError(404, "User not found");

  user.isVerified = true;
  user.verifiedAt = new Date();
  user.verifiedBy = req.user._id;
  if (user.status === USER_STATUS.PENDING) {
    user.status = USER_STATUS.ACTIVE;
    user.statusChangedAt = new Date();
    user.statusChangedBy = req.user._id;
  }
  await user.save();

  await notifyAccountApproved({ userId: user._id });
  await logAdminAction({
    actor: req.user._id,
    action: "user.verify",
    resource: "user",
    resourceId: user._id,
    targetUser: user._id,
    after: { isVerified: true, status: user.status },
    ip: req.ip,
    userAgent: req.headers["user-agent"],
  });

  sendResponse(res, 200, "User verified successfully");
});

export const suspendUser = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, "User not found");
  if (user.deletedAt) throw new ApiError(400, "Cannot suspend a deleted user");

  const beforeStatus = user.status;
  user.transitionTo(USER_STATUS.SUSPENDED, { reason, changedBy: req.user._id });
  user.refreshTokenHash = undefined;
  user.refreshTokenExpiresAt = undefined;
  await user.save();

  await notifyAccountSuspended({ userId: user._id, reason });
  await logAdminAction({
    actor: req.user._id,
    action: "user.suspend",
    resource: "user",
    resourceId: user._id,
    targetUser: user._id,
    before: { status: beforeStatus },
    after: { status: USER_STATUS.SUSPENDED, reason },
    ip: req.ip,
    userAgent: req.headers["user-agent"],
  });

  sendResponse(res, 200, "User suspended successfully");
});

export const reactivateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, "User not found");

  const beforeStatus = user.status;
  user.transitionTo(USER_STATUS.ACTIVE, { changedBy: req.user._id });
  await user.save();

  await notifyAccountUnsuspended({ userId: user._id });
  await logAdminAction({
    actor: req.user._id,
    action: "user.reactivate",
    resource: "user",
    resourceId: user._id,
    targetUser: user._id,
    before: { status: beforeStatus },
    after: { status: USER_STATUS.ACTIVE },
    ip: req.ip,
    userAgent: req.headers["user-agent"],
  });

  sendResponse(res, 200, "User reactivated successfully");
});

export const banUser = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, "User not found");

  const beforeStatus = user.status;
  user.transitionTo(USER_STATUS.BANNED, { reason, changedBy: req.user._id });
  user.refreshTokenHash = undefined;
  user.refreshTokenExpiresAt = undefined;
  await user.save();

  await notifyAccountBanned({ userId: user._id, reason });
  await logAdminAction({
    actor: req.user._id,
    action: "user.ban",
    resource: "user",
    resourceId: user._id,
    targetUser: user._id,
    before: { status: beforeStatus },
    after: { status: USER_STATUS.BANNED, reason },
    ip: req.ip,
    userAgent: req.headers["user-agent"],
  });

  sendResponse(res, 200, "User banned permanently");
});

export const softDeleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, "User not found");
  if (user.deletedAt) throw new ApiError(400, "User is already deleted");

  const beforeStatus = user.status;
  user.deletedAt = new Date();
  user.deletedBy = req.user._id;
  user.refreshTokenHash = undefined;
  user.refreshTokenExpiresAt = undefined;
  user.status = USER_STATUS.DELETED;
  user.statusChangedAt = new Date();
  user.statusChangedBy = req.user._id;
  await user.save();

  await notifyAccountDeleted({ userId: user._id });
  await logAdminAction({
    actor: req.user._id,
    action: "user.soft_delete",
    resource: "user",
    resourceId: user._id,
    targetUser: user._id,
    before: { status: beforeStatus },
    after: { status: USER_STATUS.DELETED, deletedAt: user.deletedAt },
    ip: req.ip,
    userAgent: req.headers["user-agent"],
  });

  sendResponse(res, 200, "User deleted");
});

export const restoreUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, "User not found");
  if (!user.deletedAt) throw new ApiError(400, "User is not deleted");

  user.deletedAt = undefined;
  user.deletedBy = undefined;
  user.restoredAt = new Date();
  user.restoredBy = req.user._id;
  user.status = USER_STATUS.ACTIVE;
  user.statusChangedAt = new Date();
  user.statusChangedBy = req.user._id;
  await user.save();

  await logAdminAction({
    actor: req.user._id,
    action: "user.restore",
    resource: "user",
    resourceId: user._id,
    targetUser: user._id,
    before: { status: USER_STATUS.DELETED, deletedAt: user.deletedAt },
    after: { status: USER_STATUS.ACTIVE, restoredAt: user.restoredAt },
    ip: req.ip,
    userAgent: req.headers["user-agent"],
  });

  const restored = await User.findById(user._id).select(SENSITIVE_FIELDS).lean();
  sendResponse(res, 200, "User restored successfully", { user: restored });
});

export const permanentDeleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, "User not found");
  if (!user.deletedAt) {
    const daysSinceDeletion = Math.floor((Date.now() - new Date(user.deletedAt || Date.now()).getTime()) / (24 * 60 * 60 * 1000));
    if (daysSinceDeletion < DELETION_RETENTION_DAYS) {
      throw new ApiError(400, `User must be deleted for at least ${DELETION_RETENTION_DAYS} days before permanent deletion. ${DELETION_RETENTION_DAYS - daysSinceDeletion} days remaining.`);
    }
  }

  await logAdminAction({
    actor: req.user._id,
    action: "user.permanent_delete",
    resource: "user",
    resourceId: user._id,
    targetUser: user._id,
    before: { fullName: user.fullName, email: user.email },
    ip: req.ip,
    userAgent: req.headers["user-agent"],
  });

  await User.findByIdAndDelete(req.params.id);
  sendResponse(res, 200, "User permanently deleted");
});

export const forceLogoutUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select("+refreshTokenHash +refreshTokenExpiresAt");
  if (!user) throw new ApiError(404, "User not found");

  user.refreshTokenHash = undefined;
  user.refreshTokenExpiresAt = undefined;
  user.activeSessions = 0;
  await user.save();

  await logAdminAction({
    actor: req.user._id,
    action: "user.force_logout",
    resource: "user",
    resourceId: user._id,
    targetUser: user._id,
    ip: req.ip,
    userAgent: req.headers["user-agent"],
  });

  sendResponse(res, 200, "User logged out of all sessions");
});

export const resetUserPassword = asyncHandler(async (req, res) => {
  const { newPassword } = req.body;
  const user = await User.findById(req.params.id).select(
    "+password +refreshTokenHash +refreshTokenExpiresAt +passwordResetHash +passwordResetExpiresAt"
  );
  if (!user) throw new ApiError(404, "User not found");

  user.password = await bcrypt.hash(newPassword, 10);
  user.refreshTokenHash = undefined;
  user.refreshTokenExpiresAt = undefined;
  user.passwordResetHash = undefined;
  user.passwordResetExpiresAt = undefined;
  await user.save();

  await notifyPasswordReset({ userId: user._id });
  await logAdminAction({
    actor: req.user._id,
    action: "user.reset_password",
    resource: "user",
    resourceId: user._id,
    targetUser: user._id,
    ip: req.ip,
    userAgent: req.headers["user-agent"],
  });

  sendResponse(res, 200, "Password reset successfully");
});

export const bulkAction = asyncHandler(async (req, res) => {
  const { action, userIds, reason } = req.body;
  if (!Array.isArray(userIds) || userIds.length === 0) {
    throw new ApiError(400, "userIds must be a non-empty array");
  }
  if (userIds.length > 100) {
    throw new ApiError(400, "Maximum 100 users per bulk action");
  }

  const validActions = ["approve", "reject", "suspend", "reactivate", "soft_delete", "verify"];
  if (!validActions.includes(action)) {
    throw new ApiError(400, `Invalid action. Must be one of: ${validActions.join(", ")}`);
  }

  const users = await User.find({ _id: { $in: userIds } });
  const results = { success: [], failed: [] };

  for (const user of users) {
    try {
      switch (action) {
        case "approve": {
          if (user.mentorStatus === "pending" || user.status === USER_STATUS.PENDING) {
            user.mentorStatus = "approved";
            user.isVerified = true;
            user.verifiedAt = new Date();
            user.verifiedBy = req.user._id;
            user.status = USER_STATUS.ACTIVE;
            user.statusChangedAt = new Date();
            user.statusChangedBy = req.user._id;
            await user.save();
            await notifyMentorApproved({ userId: user._id });
          }
          break;
        }
        case "reject": {
          if (user.mentorStatus === "pending") {
            user.mentorStatus = "rejected";
            user.status = USER_STATUS.REJECTED;
            user.statusChangedAt = new Date();
            user.statusChangedBy = req.user._id;
            await user.save();
            await notifyMentorRejected({ userId: user._id, reason });
          }
          break;
        }
        case "suspend": {
          user.status = USER_STATUS.SUSPENDED;
          user.statusReason = reason;
          user.statusChangedAt = new Date();
          user.statusChangedBy = req.user._id;
          user.refreshTokenHash = undefined;
          user.refreshTokenExpiresAt = undefined;
          await user.save();
          await notifyAccountSuspended({ userId: user._id, reason });
          break;
        }
        case "reactivate": {
          user.status = USER_STATUS.ACTIVE;
          user.statusReason = undefined;
          user.statusChangedAt = new Date();
          user.statusChangedBy = req.user._id;
          await user.save();
          await notifyAccountUnsuspended({ userId: user._id });
          break;
        }
        case "soft_delete": {
          user.deletedAt = new Date();
          user.deletedBy = req.user._id;
          user.status = USER_STATUS.DELETED;
          user.statusChangedAt = new Date();
          user.statusChangedBy = req.user._id;
          user.refreshTokenHash = undefined;
          user.refreshTokenExpiresAt = undefined;
          await user.save();
          break;
        }
        case "verify": {
          user.isVerified = true;
          user.verifiedAt = new Date();
          user.verifiedBy = req.user._id;
          await user.save();
          break;
        }
      }
      results.success.push(String(user._id));
    } catch (error) {
      results.failed.push({ id: String(user._id), error: error.message });
    }
  }

  await logAdminAction({
    actor: req.user._id,
    action: `bulk.${action}`,
    resource: "user",
    metadata: { userIds, successCount: results.success.length, failedCount: results.failed.length, reason },
    ip: req.ip,
    userAgent: req.headers["user-agent"],
  });

  sendResponse(res, 200, `Bulk ${action} completed`, results);
});

export const exportUsers = asyncHandler(async (req, res) => {
  const filter = buildUserFilter(req.query);
  const sort = buildSort(req.query.sort);

  const users = await User.find(filter)
    .select("fullName email role status mentorStatus isVerified xp level city currentCompany createdAt lastLoginAt")
    .sort(sort)
    .lean();

  const csvHeader = "Full Name,Email,Role,Status,Mentor Status,Verified,XP,Level,City,Company,Joined Date,Last Login\n";
  const csvRows = users.map((u) => {
    const escape = (v) => `"${(v ?? "").toString().replace(/"/g, '""')}"`;
    return [
      escape(u.fullName), escape(u.email), escape(u.role), escape(u.status),
      escape(u.mentorStatus), u.isVerified ? "Yes" : "No", u.xp ?? 0, u.level ?? 1,
      escape(u.city), escape(u.currentCompany),
      u.createdAt ? new Date(u.createdAt).toISOString().split("T")[0] : "",
      u.lastLoginAt ? new Date(u.lastLoginAt).toISOString().split("T")[0] : "",
    ].join(",");
  }).join("\n");

  const csv = csvHeader + csvRows;
  const filename = `users-export-${new Date().toISOString().split("T")[0]}.csv`;

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.send(csv);

  await logAdminAction({
    actor: req.user._id,
    action: "user.export",
    resource: "user",
    metadata: { filter: req.query, count: users.length, format: "csv" },
    ip: req.ip,
    userAgent: req.headers["user-agent"],
  });
});

export const sendAnnouncement = asyncHandler(async (req, res) => {
  const { recipientIds, message, link } = req.body;
  if (!message?.trim()) throw new ApiError(400, "Message is required");
  if (!Array.isArray(recipientIds) || recipientIds.length === 0) {
    throw new ApiError(400, "recipientIds must be a non-empty array");
  }
  if (recipientIds.length > 500) {
    throw new ApiError(400, "Maximum 500 recipients per announcement");
  }

  await notifyAnnouncement({ recipientIds, message, link });
  await logAdminAction({
    actor: req.user._id,
    action: "announcement.send",
    resource: "announcement",
    metadata: { recipientCount: recipientIds.length, message: message.slice(0, 100) },
    ip: req.ip,
    userAgent: req.headers["user-agent"],
  });

  sendResponse(res, 200, `Announcement sent to ${recipientIds.length} users`);
});

export const getUserAnalytics = asyncHandler(async (req, res) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const startOfWeek = new Date(today.getTime() - today.getDay() * 24 * 60 * 60 * 1000);
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const [
    totalUsers,
    statusCounts,
    roleCounts,
    dailySignups,
    weeklySignups,
    monthlySignups,
    verifiedCount,
    mentorStats,
    activeUsers,
    returningUsers,
  ] = await Promise.all([
    User.countDocuments({ deletedAt: null }),
    User.aggregate([
      { $match: { deletedAt: null } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
    User.aggregate([
      { $match: { deletedAt: null } },
      { $group: { _id: "$role", count: { $sum: 1 } } },
    ]),
    User.aggregate([
      { $match: { createdAt: { $gte: today }, deletedAt: null } },
      { $group: { _id: null, count: { $sum: 1 } } },
    ]),
    User.aggregate([
      { $match: { createdAt: { $gte: startOfWeek }, deletedAt: null } },
      { $group: { _id: null, count: { $sum: 1 } } },
    ]),
    User.aggregate([
      { $match: { createdAt: { $gte: startOfMonth }, deletedAt: null } },
      { $group: { _id: null, count: { $sum: 1 } } },
    ]),
    User.countDocuments({ isVerified: true, deletedAt: null }),
    User.aggregate([
      { $match: { role: "mentor", deletedAt: null } },
      {
        $group: {
          _id: "$mentorStatus",
          count: { $sum: 1 },
          avgScore: { $avg: "$mentorScore" },
        },
      },
    ]),
    User.countDocuments({ lastLoginAt: { $gte: sevenDaysAgo }, deletedAt: null }),
    User.countDocuments({
      lastLoginAt: { $gte: thirtyDaysAgo, $lte: sevenDaysAgo },
      createdAt: { $lte: thirtyDaysAgo },
      deletedAt: null,
    }),
  ]);

  const dormantUsers = await User.countDocuments({
    lastLoginAt: { $lte: thirtyDaysAgo },
    createdAt: { $lte: thirtyDaysAgo },
    deletedAt: null,
    status: { $ne: USER_STATUS.DELETED },
  });

  sendResponse(res, 200, "User analytics", {
    metrics: {
      totalUsers,
      verifiedUsers: verifiedCount,
      activeUsers,
      returningUsers,
      dormantUsers,
      signups: {
        today: dailySignups[0]?.count ?? 0,
        thisWeek: weeklySignups[0]?.count ?? 0,
        thisMonth: monthlySignups[0]?.count ?? 0,
      },
      engagement: {
        activeRate: totalUsers ? Math.round((activeUsers / totalUsers) * 100) : 0,
        returnRate: totalUsers ? Math.round((returningUsers / totalUsers) * 100) : 0,
        dormantRate: totalUsers ? Math.round((dormantUsers / totalUsers) * 100) : 0,
      },
    },
    byStatus: statusCounts.reduce((acc, s) => ({ ...acc, [s._id]: s.count }), {}),
    byRole: roleCounts.reduce((acc, r) => ({ ...acc, [r._id]: r.count }), {}),
    mentorStats: mentorStats.reduce((acc, m) => ({
      ...acc,
      [m._id || "unknown"]: { count: m.count, avgScore: Math.round(m.avgScore || 0) },
    }), {}),
  });
});

export const getDeletedUsers = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);

  const [users, total] = await Promise.all([
    User.find({ deletedAt: { $ne: null } })
      .select(SENSITIVE_FIELDS)
      .sort({ deletedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    User.countDocuments({ deletedAt: { $ne: null } }),
  ]);

  const items = users.map((u) => ({
    ...u,
    id: u._id?.toString?.() ?? u._id,
    daysSinceDeletion: Math.floor((Date.now() - new Date(u.deletedAt).getTime()) / (24 * 60 * 60 * 1000)),
    canBePermanentlyDeleted: Math.floor((Date.now() - new Date(u.deletedAt).getTime()) / (24 * 60 * 60 * 1000)) >= DELETION_RETENTION_DAYS,
  }));

  sendResponse(res, 200, "Deleted users fetched", {
    items,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
});
