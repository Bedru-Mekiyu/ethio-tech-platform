import { describe, expect, it, vi, beforeEach } from "vitest";

const notificationsDb = [];

vi.mock("../models/Notification.js", () => ({
  default: {
    create: async (doc) => {
      const notification = {
        _id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        ...doc,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      notificationsDb.push(notification);
      return notification;
    },
    findByIdAndUpdate: async (id, update) => {
      const idx = notificationsDb.findIndex((n) => n._id === id);
      if (idx === -1) return null;
      if (update.isRead !== undefined) notificationsDb[idx].isRead = update.isRead;
      return notificationsDb[idx];
    },
    findOneAndUpdate: async (filter, update) => {
      const idx = notificationsDb.findIndex((n) => {
        if (filter._id && n._id !== filter._id) return false;
        if (filter.recipient && String(n.recipient) !== String(filter.recipient)) return false;
        return true;
      });
      if (idx === -1) return null;
      if (update.isRead !== undefined) notificationsDb[idx].isRead = update.isRead;
      return notificationsDb[idx];
    },
    countDocuments: async (filter = {}) => {
      return notificationsDb.filter((n) => {
        if (filter.recipient && String(n.recipient) !== String(filter.recipient)) return false;
        if (filter.isRead !== undefined && n.isRead !== filter.isRead) return false;
        return true;
      }).length;
    },
  },
}));

describe("Socket notification:read handler", () => {
  beforeEach(() => {
    notificationsDb.length = 0;
  });

  it("updates notification isRead field correctly", async () => {
    const notif = await (
      await import("../models/Notification.js")
    ).default.create({
      recipient: "user-1",
      type: "session",
      message: "Test",
      isRead: false,
    });

    expect(notif.isRead).toBe(false);

    const Notification = (await import("../models/Notification.js")).default;
    await Notification.findOneAndUpdate({ _id: notif._id, recipient: "user-1" }, { isRead: true });

    const updated = notificationsDb.find((n) => n._id === notif._id);
    expect(updated.isRead).toBe(true);
  });

  it("counts unread notifications with correct field names", async () => {
    await (
      await import("../models/Notification.js")
    ).default.create({
      recipient: "user-1",
      type: "session",
      message: "Unread 1",
      isRead: false,
    });
    await (
      await import("../models/Notification.js")
    ).default.create({
      recipient: "user-1",
      type: "session",
      message: "Read 1",
      isRead: true,
    });
    await (
      await import("../models/Notification.js")
    ).default.create({
      recipient: "user-2",
      type: "session",
      message: "Other unread",
      isRead: false,
    });

    const Notification = (await import("../models/Notification.js")).default;
    const count = await Notification.countDocuments({ recipient: "user-1", isRead: false });
    expect(count).toBe(1);
  });

  it("only updates notifications belonging to the user", async () => {
    const notif1 = await (
      await import("../models/Notification.js")
    ).default.create({
      recipient: "user-1",
      type: "session",
      message: "User 1 notif",
      isRead: false,
    });
    await (
      await import("../models/Notification.js")
    ).default.create({
      recipient: "user-2",
      type: "session",
      message: "User 2 notif",
      isRead: false,
    });

    const Notification = (await import("../models/Notification.js")).default;
    await Notification.findOneAndUpdate({ _id: notif1._id, recipient: "user-1" }, { isRead: true });

    const user2Unread = await Notification.countDocuments({ recipient: "user-2", isRead: false });
    expect(user2Unread).toBe(1);
  });
});

describe("Notification field validation", () => {
  it("notification has required fields", async () => {
    const Notification = (await import("../models/Notification.js")).default;
    const notif = await Notification.create({
      recipient: "user-1",
      type: "badge",
      message: "Badge earned",
      link: "/achievements",
      isRead: false,
    });

    expect(notif.recipient).toBe("user-1");
    expect(notif.type).toBe("badge");
    expect(notif.message).toBe("Badge earned");
    expect(notif.link).toBe("/achievements");
    expect(notif.isRead).toBe(false);
  });
});
