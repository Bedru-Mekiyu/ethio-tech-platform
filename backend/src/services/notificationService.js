import { emitNotification, emitNotificationBulk } from "./notificationHelper.js";

export const notifyUser = async ({ recipientId, type, message, link, createdBy }) => {
  if (!recipientId || !message) return null;
  return emitNotification({ recipientId, type, message, link, createdBy });
};

export const notifyManyUsers = async ({ recipientIds, type, message, link, createdBy }) => {
  if (!recipientIds?.length || !message) return [];
  return emitNotificationBulk({ recipientIds, type, message, link, createdBy });
};

export const notifyXpEarned = async ({ userId, amount, reason, link }) => {
  return notifyUser({
    recipientId: userId,
    type: "xp",
    message: `+${amount} XP: ${reason}`,
    link: link ?? "/app/xp",
  });
};

export const notifyBadgeEarned = async ({ userId, badgeName, link }) => {
  return notifyUser({
    recipientId: userId,
    type: "badge",
    message: `Badge unlocked: ${badgeName}`,
    link: link ?? "/app/achievements",
  });
};

export const notifySessionCreated = async ({ userId, sessionTitle, sessionId }) => {
  return notifyUser({
    recipientId: userId,
    type: "session",
    message: `New session: ${sessionTitle}`,
    link: `/sessions/${sessionId}`,
  });
};

export const notifySessionUpdated = async ({ userId, sessionTitle, sessionId }) => {
  return notifyUser({
    recipientId: userId,
    type: "session",
    message: `Session updated: ${sessionTitle}`,
    link: `/sessions/${sessionId}`,
  });
};

export const notifySessionCancelled = async ({ userId, sessionTitle, sessionId }) => {
  return notifyUser({
    recipientId: userId,
    type: "session",
    message: `Session cancelled: ${sessionTitle}`,
    link: `/sessions/${sessionId}`,
  });
};

export const notifySessionRescheduled = async ({ userId, sessionTitle, sessionId }) => {
  return notifyUser({
    recipientId: userId,
    type: "session",
    message: `Session rescheduled: ${sessionTitle}`,
    link: `/sessions/${sessionId}`,
  });
};

export const notifySessionStarted = async ({ userId, sessionTitle, sessionId }) => {
  return notifyUser({
    recipientId: userId,
    type: "session",
    message: `Session is live: ${sessionTitle}`,
    link: `/sessions/${sessionId}`,
  });
};

export const notifyFeedbackRequested = async ({ userId, sessionTitle, sessionId }) => {
  return notifyUser({
    recipientId: userId,
    type: "session",
    message: `Please leave feedback for: ${sessionTitle}`,
    link: `/sessions/${sessionId}/feedback`,
  });
};

export const notifyAccountApproved = async ({ userId }) => {
  return notifyUser({
    recipientId: userId,
    type: "account_approved",
    message: "Your account has been approved. Welcome aboard!",
    link: "/app/dashboard",
  });
};

export const notifyAccountRejected = async ({ userId, reason }) => {
  return notifyUser({
    recipientId: userId,
    type: "account_rejected",
    message: `Your account registration was not approved${reason ? `: ${reason}` : ""}.`,
    link: "/contact",
  });
};

export const notifyAccountSuspended = async ({ userId, reason }) => {
  return notifyUser({
    recipientId: userId,
    type: "account_suspended",
    message: `Your account has been temporarily suspended${reason ? `: ${reason}` : ""}.`,
    link: "/contact",
  });
};

export const notifyAccountUnsuspended = async ({ userId }) => {
  return notifyUser({
    recipientId: userId,
    type: "account_unsuspended",
    message: "Your account has been reactivated. You can now log in.",
    link: "/login",
  });
};

export const notifyAccountBanned = async ({ userId, reason }) => {
  return notifyUser({
    recipientId: userId,
    type: "account_banned",
    message: `Your account has been permanently banned${reason ? `: ${reason}` : ""}.`,
    link: "/contact",
  });
};

export const notifyRoleChanged = async ({ userId, newRole }) => {
  return notifyUser({
    recipientId: userId,
    type: "role_changed",
    message: `Your role has been updated to ${newRole.replace("_", " ")}.`,
    link: "/app/dashboard",
  });
};

export const notifyMentorApproved = async ({ userId }) => {
  return notifyUser({
    recipientId: userId,
    type: "mentor_approved",
    message: "Congratulations! Your mentor application has been approved.",
    link: "/mentor",
  });
};

export const notifyMentorRejected = async ({ userId, reason }) => {
  return notifyUser({
    recipientId: userId,
    type: "mentor_rejected",
    message: `Your mentor application was not approved${reason ? `: ${reason}` : ""}. You may reapply after making improvements.`,
    link: "/mentor-recruitment",
  });
};

export const notifyMentorChangesRequested = async ({ userId, notes }) => {
  return notifyUser({
    recipientId: userId,
    type: "mentor",
    message: `Your mentor application needs changes${notes ? `: ${notes}` : ""}. Please update and resubmit.`,
    link: "/mentor-recruitment",
  });
};

export const notifyAccountDeleted = async ({ userId }) => {
  return notifyUser({
    recipientId: userId,
    type: "account_deleted",
    message: "Your account has been deleted. If you believe this was an error, please contact support.",
    link: "/contact",
  });
};

export const notifyPasswordReset = async ({ userId }) => {
  return notifyUser({
    recipientId: userId,
    type: "password_reset",
    message: "Your password has been reset by an administrator.",
    link: "/login",
  });
};

export const notifyAnnouncement = async ({ recipientIds, message, link }) => {
  return notifyManyUsers({ recipientIds, type: "announcement", message, link });
};
