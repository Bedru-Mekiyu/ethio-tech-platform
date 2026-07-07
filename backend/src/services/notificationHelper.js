import { logger } from "../lib/logger.js";

let ioRef = null;

export function setSocketIO(io) {
  ioRef = io;
}

export function getSocketIO() {
  return ioRef;
}

export async function emitNotification(payload) {
  try {
    const { default: Notification } = await import("../models/Notification.js");
    const { default: NotificationPreference } = await import("../models/NotificationPreference.js");

    const prefType = payload.type === "mentor_approved" || payload.type === "mentor_rejected"
      ? payload.type
      : payload.type === "account_approved" || payload.type === "account_created"
        ? "account_approved"
        : payload.type;

    const prefs = await NotificationPreference.findOne({ user: payload.recipientId }).lean();
    if (prefs?.preferences && prefs.preferences[prefType] === false) {
      return null;
    }

    const notification = await Notification.create({
      recipient: payload.recipientId,
      type: payload.type,
      message: payload.message,
      link: payload.link,
      isRead: false,
      createdBy: payload.createdBy,
    });

    if (ioRef) {
      const userSockets = Array.from(ioRef.sockets.sockets.values()).filter(
        (s) => s.data.user?.id === String(payload.recipientId),
      );

      for (const socket of userSockets) {
        socket.emit("notification:new", {
          userId: payload.recipientId,
          notificationId: String(notification._id),
          type: payload.type,
          message: payload.message,
          link: payload.link,
          at: notification.createdAt?.toISOString?.() || new Date().toISOString(),
        });
      }

      const unreadCount = await Notification.countDocuments({
        recipient: payload.recipientId,
        isRead: false,
      });

      for (const socket of userSockets) {
        socket.emit("notification:count", {
          userId: payload.recipientId,
          count: unreadCount,
        });
      }
    }

    return notification;
  } catch (err) {
    logger.warn("Failed to emit notification", { error: err, userId: payload.recipientId });
    return null;
  }
}

export async function emitNotificationBulk(payload) {
  try {
    const { default: Notification } = await import("../models/Notification.js");
    const docs = payload.recipientIds.map((id) => ({
      recipient: id,
      type: payload.type,
      message: payload.message,
      link: payload.link,
      isRead: false,
      createdBy: payload.createdBy,
    }));
    const notifications = await Notification.insertMany(docs);

    if (ioRef) {
      for (const recipientId of payload.recipientIds) {
        const userSockets = Array.from(ioRef.sockets.sockets.values()).filter(
          (s) => s.data.user?.id === String(recipientId),
        );

        const notif = notifications.find((n) => String(n.recipient) === String(recipientId));
        for (const socket of userSockets) {
          socket.emit("notification:new", {
            userId: recipientId,
            notificationId: notif ? String(notif._id) : "",
            type: payload.type,
            message: payload.message,
            link: payload.link,
            at: new Date().toISOString(),
          });
        }

        const unreadCount = await Notification.countDocuments({
          recipient: recipientId,
          isRead: false,
        });

        for (const socket of userSockets) {
          socket.emit("notification:count", {
            userId: recipientId,
            count: unreadCount,
          });
        }
      }
    }

    return notifications;
  } catch (err) {
    logger.warn("Failed to emit bulk notifications", { error: err, count: payload.recipientIds?.length });
    return [];
  }
}
