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

import { notifyUser, notifyManyUsers } from "../services/notificationService.js";

beforeEach(() => {
  notificationsDb.length = 0;
});

describe("Session lifecycle notifications", () => {
  it("session update notifies all participants", async () => {
    const participants = ["student-1", "student-2", "student-3"];
    await notifyManyUsers({
      recipientIds: participants,
      type: "session",
      message: "Session updated: React 101",
      link: "/sessions/sess-1",
      createdBy: "mentor-1",
    });

    const Notification = (await import("../models/Notification.js")).default;
    for (const participant of participants) {
      const count = await Notification.countDocuments({ recipient: participant, isRead: false });
      expect(count).toBe(1);
    }
  });

  it("session cancel notifies all participants", async () => {
    const participants = ["student-1", "student-2"];
    await notifyManyUsers({
      recipientIds: participants,
      type: "session",
      message: "Session canceled: React 101. Reason: Instructor unavailable",
      link: "/sessions/sess-1",
      createdBy: "mentor-1",
    });

    expect(notificationsDb.length).toBe(2);
    expect(notificationsDb[0].message).toContain("canceled");
    expect(notificationsDb[1].message).toContain("canceled");
  });

  it("session reschedule notifies all participants", async () => {
    const participants = ["student-1", "student-2"];
    await notifyManyUsers({
      recipientIds: participants,
      type: "session",
      message: "Session rescheduled: React 101. New date: 6/10/2026",
      link: "/sessions/sess-1",
      createdBy: "mentor-1",
    });

    expect(notificationsDb.length).toBe(2);
    expect(notificationsDb[0].message).toContain("rescheduled");
  });

  it("participant join notifies mentor", async () => {
    await notifyUser({
      recipientId: "mentor-1",
      type: "session",
      message: "A new participant joined your session: React 101",
      link: "/sessions/sess-1",
      createdBy: "student-1",
    });

    expect(notificationsDb.length).toBe(1);
    expect(notificationsDb[0].recipient).toBe("mentor-1");
    expect(notificationsDb[0].message).toContain("joined");
  });

  it("participant leave notifies mentor", async () => {
    await notifyUser({
      recipientId: "mentor-1",
      type: "session",
      message: "A participant left your session: React 101",
      link: "/sessions/sess-1",
      createdBy: "student-1",
    });

    expect(notificationsDb.length).toBe(1);
    expect(notificationsDb[0].message).toContain("left");
  });

  it("session feedback notifies mentor", async () => {
    await notifyUser({
      recipientId: "mentor-1",
      type: "session",
      message: "New feedback submitted for session: React 101",
      link: "/sessions/sess-1",
      createdBy: "student-1",
    });

    expect(notificationsDb.length).toBe(1);
    expect(notificationsDb[0].message).toContain("feedback");
  });
});

describe("Admin notifications", () => {
  it("account restore notifies user", async () => {
    await notifyUser({
      recipientId: "user-1",
      type: "account_unsuspended",
      message: "Your account has been reactivated. You can now log in.",
      link: "/login",
    });

    expect(notificationsDb.length).toBe(1);
    expect(notificationsDb[0].type).toBe("account_unsuspended");
  });

  it("force logout notifies user", async () => {
    await notifyUser({
      recipientId: "user-1",
      type: "system",
      message: "You have been logged out by an administrator.",
      link: "/login",
    });

    expect(notificationsDb.length).toBe(1);
    expect(notificationsDb[0].type).toBe("system");
  });

  it("bulk soft delete notifies users", async () => {
    await notifyManyUsers({
      recipientIds: ["user-1", "user-2"],
      type: "account_deleted",
      message: "Your account has been deleted.",
      link: "/contact",
    });

    expect(notificationsDb.length).toBe(2);
    expect(notificationsDb[0].type).toBe("account_deleted");
  });

  it("bulk verify notifies users", async () => {
    await notifyManyUsers({
      recipientIds: ["user-1", "user-2"],
      type: "account_approved",
      message: "Your account has been approved.",
      link: "/app/dashboard",
    });

    expect(notificationsDb.length).toBe(2);
    expect(notificationsDb[0].type).toBe("account_approved");
  });
});

describe("Certificate notification", () => {
  it("certificate issuance notifies student", async () => {
    await notifyUser({
      recipientId: "student-1",
      type: "badge",
      message: "Certificate issued for track: Web Development",
      link: "/app/certificates",
      createdBy: "admin-1",
    });

    expect(notificationsDb.length).toBe(1);
    expect(notificationsDb[0].message).toContain("Certificate");
    expect(notificationsDb[0].message).toContain("Web Development");
  });
});

describe("Assignment notifications", () => {
  it("new assignment notifies assigned students", async () => {
    await notifyManyUsers({
      recipientIds: ["student-1", "student-2", "student-3"],
      type: "session",
      message: "New assignment: Build a REST API",
      link: "/app/assignments",
      createdBy: "mentor-1",
    });

    expect(notificationsDb.length).toBe(3);
    for (const n of notificationsDb) {
      expect(n.message).toContain("Build a REST API");
    }
  });
});

describe("Cohort notifications", () => {
  it("student added to cohort notifies student", async () => {
    await notifyUser({
      recipientId: "student-1",
      type: "system",
      message: "You have been added to cohort: Batch 2026",
      link: "/app/dashboard",
      createdBy: "admin-1",
    });

    expect(notificationsDb.length).toBe(1);
    expect(notificationsDb[0].message).toContain("Batch 2026");
  });

  it("student removed from cohort notifies student", async () => {
    await notifyUser({
      recipientId: "student-1",
      type: "system",
      message: "You have been removed from a cohort.",
      link: "/app/dashboard",
      createdBy: "admin-1",
    });

    expect(notificationsDb.length).toBe(1);
    expect(notificationsDb[0].message).toContain("removed");
  });
});

describe("Password change security notification", () => {
  it("password change notifies user", async () => {
    await notifyUser({
      recipientId: "user-1",
      type: "system",
      message: "Your password was changed successfully.",
      link: "/app/settings",
      createdBy: "user-1",
    });

    expect(notificationsDb.length).toBe(1);
    expect(notificationsDb[0].type).toBe("system");
    expect(notificationsDb[0].message).toContain("password");
  });
});

describe("Mentor application notifications", () => {
  it("application submission notifies admins", async () => {
    await notifyManyUsers({
      recipientIds: ["admin-1", "admin-2"],
      type: "mentor",
      message: "New mentor application from John Doe (john@example.com)",
      link: "/admin/moderation",
    });

    expect(notificationsDb.length).toBe(2);
  });

  it("application submission confirms to applicant", async () => {
    await notifyUser({
      recipientId: "user-1",
      type: "mentor",
      message: "Your mentor application has been received.",
      link: "/mentor-recruitment",
    });

    expect(notificationsDb.length).toBe(1);
    expect(notificationsDb[0].message).toContain("received");
  });
});

describe("Notification TTL", () => {
  it("notification has createdAt timestamp", async () => {
    const notif = await notifyUser({
      recipientId: "user-1",
      type: "session",
      message: "Test notification",
    });

    expect(notif.createdAt).toBeDefined();
    expect(notif.createdAt instanceof Date).toBe(true);
  });
});
