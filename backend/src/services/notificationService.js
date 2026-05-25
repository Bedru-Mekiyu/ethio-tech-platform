import Notification from "../models/Notification.js";

export const notifyUser = async ({ recipientId, type, message, link }) => {
  if (!recipientId || !message) return null;
  return Notification.create({
    recipient: recipientId,
    type,
    message,
    link: link ?? undefined,
  });
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
