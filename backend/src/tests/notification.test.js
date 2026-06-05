import { beforeEach, describe, expect, it, vi } from "vitest";

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
    insertMany: async (docs) => {
      const created = docs.map((doc, i) => ({
        _id: `notif-bulk-${Date.now()}-${i}`,
        ...doc,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));
      notificationsDb.push(...created);
      return created;
    },
    find: (filter = {}) => ({
      sort: () => ({
        skip: () => ({
          limit: () =>
            Promise.resolve(
              notificationsDb.filter((n) => {
                if (filter.recipient && String(n.recipient) !== String(filter.recipient)) return false;
                return true;
              }),
            ),
        }),
      }),
    }),
    countDocuments: async (filter = {}) => {
      return notificationsDb.filter((n) => {
        if (filter.recipient && String(n.recipient) !== String(filter.recipient)) return false;
        if (filter.isRead !== undefined && n.isRead !== filter.isRead) return false;
        return true;
      }).length;
    },
    findOne: (filter) =>
      Promise.resolve(
        notificationsDb.find((n) => {
          if (filter._id && n._id !== filter._id) return false;
          if (filter.recipient && String(n.recipient) !== String(filter.recipient)) return false;
          return true;
        }) || null,
      ),
    findOneAndUpdate: async (filter, update) => {
      const idx = notificationsDb.findIndex((n) => {
        if (filter._id && n._id !== filter._id) return false;
        if (filter.recipient && String(n.recipient) !== String(filter.recipient)) return false;
        return true;
      });
      if (idx === -1) return null;
      if (update.$set) Object.assign(notificationsDb[idx], update.$set);
      if (update.isRead !== undefined) notificationsDb[idx].isRead = update.isRead;
      return notificationsDb[idx];
    },
    updateMany: async (filter, update) => {
      let count = 0;
      for (const n of notificationsDb) {
        if (filter.recipient && String(n.recipient) !== String(filter.recipient)) continue;
        if (filter.isRead !== undefined && n.isRead !== filter.isRead) continue;
        if (update.$set?.isRead !== undefined) n.isRead = update.$set.isRead;
        count++;
      }
      return { modifiedCount: count };
    },
  },
}));

vi.mock("../services/notificationHelper.js", () => ({
  emitNotification: async (payload) => {
    const notification = {
      _id: `notif-${Date.now()}`,
      recipient: payload.recipientId,
      type: payload.type,
      message: payload.message,
      link: payload.link,
      isRead: false,
      createdBy: payload.createdBy,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    notificationsDb.push(notification);
    return notification;
  },
  emitNotificationBulk: async (payload) => {
    const created = payload.recipientIds.map((id, i) => ({
      _id: `notif-bulk-${Date.now()}-${i}`,
      recipient: id,
      type: payload.type,
      message: payload.message,
      link: payload.link,
      isRead: false,
      createdBy: payload.createdBy,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
    notificationsDb.push(...created);
    return created;
  },
  setSocketIO: vi.fn(),
  getSocketIO: vi.fn(() => null),
}));

import {
  notifyUser,
  notifyManyUsers,
  notifyXpEarned,
  notifyBadgeEarned,
  notifySessionCancelled,
  notifySessionRescheduled,
  notifyAccountApproved,
  notifyAccountSuspended,
  notifyAccountBanned,
  notifyRoleChanged,
  notifyMentorApproved,
  notifyMentorRejected,
  notifyPasswordReset,
  notifyAnnouncement,
} from "../services/notificationService.js";

beforeEach(() => {
  notificationsDb.length = 0;
});

describe("Notification Service", () => {
  describe("notifyUser", () => {
    it("creates a notification with correct fields", async () => {
      const result = await notifyUser({
        recipientId: "user-1",
        type: "session",
        message: "Test notification",
        link: "/test",
      });
      expect(result).toBeDefined();
      expect(result.recipient).toBe("user-1");
      expect(result.type).toBe("session");
      expect(result.message).toBe("Test notification");
      expect(result.link).toBe("/test");
      expect(result.isRead).toBe(false);
    });

    it("returns null for missing recipientId", async () => {
      const result = await notifyUser({ recipientId: null, type: "session", message: "Test" });
      expect(result).toBeNull();
    });

    it("returns null for missing message", async () => {
      const result = await notifyUser({ recipientId: "user-1", type: "session", message: "" });
      expect(result).toBeNull();
    });
  });

  describe("notifyManyUsers", () => {
    it("creates notifications for multiple users", async () => {
      const result = await notifyManyUsers({
        recipientIds: ["user-1", "user-2", "user-3"],
        type: "session",
        message: "Bulk notification",
      });
      expect(result).toHaveLength(3);
      expect(result[0].recipient).toBe("user-1");
      expect(result[1].recipient).toBe("user-2");
      expect(result[2].recipient).toBe("user-3");
    });

    it("returns empty array for empty recipientIds", async () => {
      const result = await notifyManyUsers({ recipientIds: [], type: "session", message: "Test" });
      expect(result).toHaveLength(0);
    });
  });

  describe("Specific notification functions", () => {
    it("notifyXpEarned creates xp notification", async () => {
      const result = await notifyXpEarned({ userId: "user-1", amount: 50, reason: "Completed lesson" });
      expect(result.type).toBe("xp");
      expect(result.message).toContain("+50 XP");
      expect(result.message).toContain("Completed lesson");
    });

    it("notifyBadgeEarned creates badge notification", async () => {
      const result = await notifyBadgeEarned({ userId: "user-1", badgeName: "First Steps" });
      expect(result.type).toBe("badge");
      expect(result.message).toContain("First Steps");
    });

    it("notifySessionCancelled creates session notification", async () => {
      const result = await notifySessionCancelled({ userId: "user-1", sessionTitle: "React 101", sessionId: "sess-1" });
      expect(result.type).toBe("session");
      expect(result.message).toContain("cancelled");
      expect(result.message).toContain("React 101");
    });

    it("notifySessionRescheduled creates session notification", async () => {
      const result = await notifySessionRescheduled({
        userId: "user-1",
        sessionTitle: "React 101",
        sessionId: "sess-1",
      });
      expect(result.type).toBe("session");
      expect(result.message).toContain("rescheduled");
    });

    it("notifyAccountApproved creates account notification", async () => {
      const result = await notifyAccountApproved({ userId: "user-1" });
      expect(result.type).toBe("account_approved");
      expect(result.message).toContain("approved");
    });

    it("notifyAccountSuspended creates account notification", async () => {
      const result = await notifyAccountSuspended({ userId: "user-1", reason: "Violation" });
      expect(result.type).toBe("account_suspended");
      expect(result.message).toContain("suspended");
    });

    it("notifyAccountBanned creates account notification", async () => {
      const result = await notifyAccountBanned({ userId: "user-1", reason: "Severe violation" });
      expect(result.type).toBe("account_banned");
      expect(result.message).toContain("banned");
    });

    it("notifyRoleChanged creates role notification", async () => {
      const result = await notifyRoleChanged({ userId: "user-1", newRole: "mentor" });
      expect(result.type).toBe("role_changed");
      expect(result.message).toContain("mentor");
    });

    it("notifyMentorApproved creates mentor notification", async () => {
      const result = await notifyMentorApproved({ userId: "user-1" });
      expect(result.type).toBe("mentor_approved");
      expect(result.message).toContain("approved");
    });

    it("notifyMentorRejected creates mentor notification", async () => {
      const result = await notifyMentorRejected({ userId: "user-1", reason: "Insufficient experience" });
      expect(result.type).toBe("mentor_rejected");
      expect(result.message).toContain("not approved");
    });

    it("notifyPasswordReset creates password notification", async () => {
      const result = await notifyPasswordReset({ userId: "user-1" });
      expect(result.type).toBe("password_reset");
      expect(result.message).toContain("password");
    });

    it("notifyAnnouncement creates announcement for multiple users", async () => {
      const result = await notifyAnnouncement({ recipientIds: ["user-1", "user-2"], message: "Platform update" });
      expect(result).toHaveLength(2);
      expect(result[0].type).toBe("announcement");
    });
  });
});

describe("Notification unread count", () => {
  it("counts unread notifications correctly", async () => {
    await notifyUser({ recipientId: "user-1", type: "session", message: "Unread 1" });
    await notifyUser({ recipientId: "user-1", type: "session", message: "Unread 2" });
    await notifyUser({ recipientId: "user-2", type: "session", message: "Other user" });

    const Notification = (await import("../models/Notification.js")).default;
    const count = await Notification.countDocuments({ recipient: "user-1", isRead: false });
    expect(count).toBe(2);
  });
});
