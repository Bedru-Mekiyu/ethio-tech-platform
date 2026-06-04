import { logger } from "../lib/logger.js";

let ioRef = null;

export function setSocketIO(io) {
  ioRef = io;
}

export async function emitNotification(payload) {
  try {
    const { default: Notification } = await import("../models/Notification.js");
    const notification = await Notification.create({
      userId: payload.userId,
      type: payload.type,
      title: payload.title,
      body: payload.body,
      link: payload.link,
      read: false,
    });

    if (ioRef) {
      const userSockets = Array.from(ioRef.sockets.sockets.values()).filter(
        (s) => s.data.user?.id === String(payload.userId),
      );

      for (const socket of userSockets) {
        socket.emit("notification:new", {
          userId: payload.userId,
          notificationId: String(notification._id),
          type: payload.type,
          title: payload.title,
          body: payload.body,
          link: payload.link,
          at: new Date().toISOString(),
        });
      }

      const unreadCount = await Notification.countDocuments({
        userId: payload.userId,
        read: false,
      });

      for (const socket of userSockets) {
        socket.emit("notification:count", {
          userId: payload.userId,
          count: unreadCount,
        });
      }
    }

    return notification;
  } catch (err) {
    logger.warn("Failed to emit notification", { error: err, userId: payload.userId });
    return null;
  }
}
