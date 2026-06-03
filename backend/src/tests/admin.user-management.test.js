import { beforeEach, describe, expect, it, vi } from "vitest";
import { USER_STATUS, ROLES, VALID_STATUS_TRANSITIONS } from "../config/permissions.js";

const usersDb = [];
const activityLogDb = [];

vi.mock("../models/User.js", () => ({
  default: {
    find: (filter = {}) => ({
      select: () => ({
        sort: () => ({
          skip: () => ({
            limit: () => ({
              lean: async () => {
                let results = usersDb.filter((u) => {
                  if (filter.deletedAt !== undefined) {
                    if (filter.deletedAt === null && u.deletedAt) return false;
                    if (filter.deletedAt !== null && !u.deletedAt) return false;
                  }
                  if (filter.role && u.role !== filter.role) return false;
                  if (filter.status && u.status !== filter.status) return false;
                  if (filter.mentorStatus && u.mentorStatus !== filter.mentorStatus) return false;
                  if (filter.$or) {
                    return filter.$or.some((condition) => {
                      const [[key, val]] = Object.entries(condition);
                      const regex = val.$regex;
                      return u[key]?.toLowerCase().includes(regex.toLowerCase());
                    });
                  }
                  return true;
                });
                return results.map((u) => ({
                  ...u,
                  id: u._id,
                  _id: u._id,
                  isDeleted: !!u.deletedAt,
                  isActive: u.status === "active",
                  isSuspended: u.status === "suspended",
                }));
              },
            }),
          }),
        }),
      }),
    }),
    findById: (id) => {
      const resolve = () => {
        const found = usersDb.find((u) => u._id === id);
        if (!found) return null;
        const doc = {
          ...found,
          save: async function () {
            const idx = usersDb.findIndex((u) => u._id === this._id);
            if (idx !== -1) usersDb[idx] = { ...usersDb[idx], ...this };
            return this;
          },
          toObject() { return { ...found, ...this }; },
          canTransitionTo(newStatus) {
            return (VALID_STATUS_TRANSITIONS[this.status || found.status] || []).includes(newStatus);
          },
          transitionTo(newStatus, { reason, changedBy } = {}) {
            if (!this.canTransitionTo(newStatus)) {
              throw new Error(`Cannot transition from ${this.status} to ${newStatus}`);
            }
            this.status = newStatus;
            this.statusReason = reason || undefined;
            this.statusChangedAt = new Date();
            this.statusChangedBy = changedBy;
            return this;
          },
          lean() { return { ...this }; },
        };
        doc.select = function () { return doc; };
        return doc;
      };
      const q = { then: (onfulfill) => Promise.resolve(resolve()).then(onfulfill) };
      q.select = () => q;
      q.lean = () => q;
      return q;
    },
    findByIdAndUpdate: async (id, update) => {
      const idx = usersDb.findIndex((u) => u._id === id);
      if (idx === -1) return null;
      usersDb[idx] = { ...usersDb[idx], ...update };
      return {
        ...usersDb[idx],
        lean: () => ({ ...usersDb[idx] }),
        select: () => ({ ...usersDb[idx] }),
      };
    },
    findByIdAndDelete: async (id) => {
      const idx = usersDb.findIndex((u) => u._id === id);
      if (idx === -1) return null;
      usersDb.splice(idx, 1);
      return { _id: id };
    },
    countDocuments: async (filter = {}) => {
      return usersDb.filter((u) => {
        if (filter.deletedAt !== undefined) {
          if (filter.deletedAt === null && u.deletedAt) return false;
        }
        if (filter.role && u.role !== filter.role) return false;
        return true;
      }).length;
    },
    aggregate: async (_pipeline) => {
      return [];
    },
    insertMany: async (docs) => {
      usersDb.push(...docs);
    },
  },
}));

vi.mock("../models/AdminActivityLog.js", () => ({
  default: {
    create: async (payload) => {
      activityLogDb.push(payload);
      return payload;
    },
  },
}));

vi.mock("../models/Notification.js", () => ({
  default: {
    create: async (payload) => payload,
    insertMany: async (payload) => payload,
  },
}));

vi.mock("bcryptjs", () => ({
  default: {
    hash: async (pwd, _salt) => `hashed:${pwd}`,
    compare: async (pwd, hash) => hash === `hashed:${pwd}`,
  },
}));

import {
  suspendUser,
  reactivateUser,
  banUser,
  softDeleteUser,
  restoreUser,
  forceLogoutUser,
  verifyUser,
  changeUserRole,
} from "../controllers/adminUserController.js";

const buildRes = () => ({
  statusCode: 200,
  body: null,
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(payload) {
    this.body = payload;
    return this;
  },
  setHeader: () => {},
  send: () => {},
});

const buildReq = (overrides = {}) => ({
  params: {},
  query: {},
  body: {},
  user: { _id: "admin-1", role: "super_admin" },
  ip: "127.0.0.1",
  headers: { "user-agent": "test-agent" },
  ...overrides,
});

describe("Admin User Management", () => {
  beforeEach(() => {
    usersDb.length = 0;
    activityLogDb.length = 0;
  });

  describe("Status Transitions", () => {
    it("validates status transitions correctly", () => {
      expect(VALID_STATUS_TRANSITIONS[USER_STATUS.PENDING]).toContain(USER_STATUS.ACTIVE);
      expect(VALID_STATUS_TRANSITIONS[USER_STATUS.PENDING]).toContain(USER_STATUS.REJECTED);
      expect(VALID_STATUS_TRANSITIONS[USER_STATUS.ACTIVE]).toContain(USER_STATUS.SUSPENDED);
      expect(VALID_STATUS_TRANSITIONS[USER_STATUS.ACTIVE]).toContain(USER_STATUS.BANNED);
      expect(VALID_STATUS_TRANSITIONS[USER_STATUS.ACTIVE]).toContain(USER_STATUS.DELETED);
      expect(VALID_STATUS_TRANSITIONS[USER_STATUS.SUSPENDED]).toContain(USER_STATUS.ACTIVE);
      expect(VALID_STATUS_TRANSITIONS[USER_STATUS.BANNED]).toEqual([USER_STATUS.DELETED]);
      expect(VALID_STATUS_TRANSITIONS[USER_STATUS.DELETED]).toEqual([]);
    });
  });

  describe("suspendUser", () => {
    it("suspends an active user", async () => {
      const user = {
        _id: "user-1",
        fullName: "Test User",
        email: "test@example.com",
        role: "student",
        status: "active",
        deletedAt: null,
        refreshTokenHash: "somehash",
        refreshTokenExpiresAt: new Date(Date.now() + 86400000),
        save: async function () {
          const idx = usersDb.findIndex((u) => u._id === this._id);
          if (idx !== -1) usersDb[idx] = { ...usersDb[idx], ...this };
          return this;
        },
        canTransitionTo: (s) => VALID_STATUS_TRANSITIONS["active"]?.includes(s) ?? false,
        transitionTo: function (newStatus, opts) {
          this.status = newStatus;
          this.statusReason = opts?.reason;
          this.statusChangedAt = new Date();
          this.statusChangedBy = opts?.changedBy;
          return this;
        },
      };
      usersDb.push(user);

      const req = buildReq({ params: { id: "user-1" }, body: { reason: "Violated community guidelines" } });
      const res = buildRes();
      const next = vi.fn();

      await suspendUser(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.statusCode).toBe(200);
      expect(res.body.message).toContain("User suspended successfully");
    });

    it("returns 404 for non-existent user", async () => {
      const req = buildReq({ params: { id: "nonexistent" }, body: {} });
      const res = buildRes();
      const next = vi.fn();

      await suspendUser(req, res, next);

      expect(next).toHaveBeenCalled();
      const err = next.mock.calls[0][0];
      expect(err.statusCode).toBe(404);
    });
  });

  describe("reactivateUser", () => {
    it("reactivates a suspended user", async () => {
      const user = {
        _id: "user-2",
        fullName: "Suspended User",
        email: "suspended@example.com",
        role: "student",
        status: "suspended",
        deletedAt: null,
        save: async function () {
          const idx = usersDb.findIndex((u) => u._id === this._id);
          if (idx !== -1) usersDb[idx] = { ...usersDb[idx], ...this };
          return this;
        },
        canTransitionTo: (_s) => true,
        transitionTo: function (newStatus, opts) {
          this.status = newStatus;
          this.statusChangedAt = new Date();
          this.statusChangedBy = opts?.changedBy;
          return this;
        },
      };
      usersDb.push(user);

      const req = buildReq({ params: { id: "user-2" } });
      const res = buildRes();
      const next = vi.fn();

      await reactivateUser(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.statusCode).toBe(200);
      expect(res.body.message).toContain("User reactivated successfully");
    });
  });

  describe("banUser", () => {
    it("bans a user permanently", async () => {
      const user = {
        _id: "user-3",
        fullName: "To Ban",
        email: "ban@example.com",
        role: "student",
        status: "active",
        deletedAt: null,
        save: async function () {
          const idx = usersDb.findIndex((u) => u._id === this._id);
          if (idx !== -1) usersDb[idx] = { ...usersDb[idx], ...this };
          return this;
        },
        canTransitionTo: (s) => VALID_STATUS_TRANSITIONS["active"]?.includes(s) ?? false,
        transitionTo: function (newStatus, opts) {
          this.status = newStatus;
          this.statusReason = opts?.reason;
          this.statusChangedAt = new Date();
          this.statusChangedBy = opts?.changedBy;
          return this;
        },
      };
      usersDb.push(user);

      const req = buildReq({ params: { id: "user-3" }, body: { reason: "Spam account" } });
      const res = buildRes();
      const next = vi.fn();

      await banUser(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.statusCode).toBe(200);
      expect(res.body.message).toContain("User banned permanently");
    });
  });

  describe("softDeleteUser", () => {
    it("soft deletes a user", async () => {
      const user = {
        _id: "user-4",
        fullName: "To Delete",
        email: "delete@example.com",
        role: "student",
        status: "active",
        deletedAt: null,
        save: async function () {
          const idx = usersDb.findIndex((u) => u._id === this._id);
          if (idx !== -1) usersDb[idx] = { ...usersDb[idx], ...this };
          return this;
        },
        canTransitionTo: (_s) => true,
        transitionTo: function (newStatus, opts) {
          this.status = newStatus;
          this.statusChangedAt = new Date();
          this.statusChangedBy = opts?.changedBy;
          return this;
        },
      };
      usersDb.push(user);

      const req = buildReq({ params: { id: "user-4" } });
      const res = buildRes();
      const next = vi.fn();

      await softDeleteUser(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.statusCode).toBe(200);
      expect(res.body.message).toContain("User deleted");
    });

    it("rejects deleting an already deleted user", async () => {
      const user = {
        _id: "user-5",
        fullName: "Already Deleted",
        email: "deleted@example.com",
        role: "student",
        status: "deleted",
        deletedAt: new Date(),
        deletedBy: "admin-1",
        save: async function () { return this; },
        canTransitionTo: (_s) => true,
        transitionTo: function () { return this; },
      };
      usersDb.push(user);

      const req = buildReq({ params: { id: "user-5" } });
      const res = buildRes();
      const next = vi.fn();

      await softDeleteUser(req, res, next);

      expect(next).toHaveBeenCalled();
      const err = next.mock.calls[0][0];
      expect(err.statusCode).toBe(400);
    });
  });

  describe("restoreUser", () => {
    it("restores a soft-deleted user", async () => {
      const user = {
        _id: "user-6",
        fullName: "Restore Me",
        email: "restore@example.com",
        role: "student",
        status: "deleted",
        deletedAt: new Date(),
        deletedBy: "admin-1",
        save: async function () {
          const idx = usersDb.findIndex((u) => u._id === this._id);
          if (idx !== -1) usersDb[idx] = { ...usersDb[idx], ...this };
          return this;
        },
        canTransitionTo: (_s) => true,
        transitionTo: function (newStatus, opts) {
          this.status = newStatus;
          this.statusChangedAt = new Date();
          this.statusChangedBy = opts?.changedBy;
          return this;
        },
      };
      usersDb.push(user);

      const req = buildReq({ params: { id: "user-6" } });
      const res = buildRes();
      const next = vi.fn();

      await restoreUser(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.statusCode).toBe(200);
      expect(res.body.message).toContain("User restored successfully");
    });
  });

  describe("verifyUser", () => {
    it("verifies an unverified user", async () => {
      const user = {
        _id: "user-7",
        fullName: "Unverified",
        email: "unverified@example.com",
        role: "student",
        status: "pending",
        isVerified: false,
        deletedAt: null,
        save: async function () {
          const idx = usersDb.findIndex((u) => u._id === this._id);
          if (idx !== -1) usersDb[idx] = { ...usersDb[idx], ...this };
          return this;
        },
        canTransitionTo: (_s) => true,
        transitionTo: function (newStatus, opts) {
          this.status = newStatus;
          this.statusChangedAt = new Date();
          this.statusChangedBy = opts?.changedBy;
          return this;
        },
      };
      usersDb.push(user);

      const req = buildReq({ params: { id: "user-7" } });
      const res = buildRes();
      const next = vi.fn();

      await verifyUser(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.statusCode).toBe(200);
    });
  });

  describe("changeUserRole", () => {
    it("changes user role", async () => {
      const user = {
        _id: "user-8",
        fullName: "Role Change",
        email: "role@example.com",
        role: "student",
        status: "active",
        deletedAt: null,
        save: async function () {
          const idx = usersDb.findIndex((u) => u._id === this._id);
          if (idx !== -1) usersDb[idx] = { ...usersDb[idx], ...this };
          return this;
        },
        toObject: () => ({ role: "student" }),
      };
      usersDb.push(user);

      const req = buildReq({ params: { id: "user-8" }, body: { role: "mentor" } });
      const res = buildRes();
      const next = vi.fn();

      await changeUserRole(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.statusCode).toBe(200);
      expect(res.body.message).toContain("User role updated");
    });
  });

  describe("forceLogoutUser", () => {
    it("clears user refresh tokens", async () => {
      const user = {
        _id: "user-9",
        fullName: "Logged Out",
        email: "logout@example.com",
        role: "student",
        refreshTokenHash: "somehash",
        refreshTokenExpiresAt: new Date(Date.now() + 86400000),
        activeSessions: 3,
        save: async function () {
          const idx = usersDb.findIndex((u) => u._id === this._id);
          if (idx !== -1) usersDb[idx] = { ...usersDb[idx], ...this };
          return this;
        },
      };
      usersDb.push(user);

      const req = buildReq({ params: { id: "user-9" } });
      const res = buildRes();
      const next = vi.fn();

      await forceLogoutUser(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.statusCode).toBe(200);
      expect(res.body.message).toContain("User logged out of all sessions");
    });
  });

  describe("RBAC Permissions", () => {
    it("defines permissions for all roles", async () => {
      const { ROLE_PERMISSIONS } = await import("../config/permissions.js");
      const roles = Object.values(ROLES);
      roles.forEach((role) => {
        expect(ROLE_PERMISSIONS[role]).toBeDefined();
        expect(Array.isArray(ROLE_PERMISSIONS[role])).toBe(true);
      });
    });

    it("super_admin has all permissions", async () => {
      const { PERMISSIONS, ROLE_PERMISSIONS } = await import("../config/permissions.js");
      const allPerms = Object.values(PERMISSIONS);
      allPerms.forEach((perm) => {
        expect(ROLE_PERMISSIONS.super_admin).toContain(perm);
      });
    });

    it("student has no permissions", async () => {
      const { ROLE_PERMISSIONS } = await import("../config/permissions.js");
      expect(ROLE_PERMISSIONS.student).toEqual([]);
    });
  });

  describe("Audit Logging", () => {
    it("creates audit log entries for admin actions", async () => {
      const user = {
        _id: "user-10",
        fullName: "Audit Test",
        email: "audit@example.com",
        role: "student",
        status: "active",
        deletedAt: null,
        save: async function () {
          const idx = usersDb.findIndex((u) => u._id === this._id);
          if (idx !== -1) usersDb[idx] = { ...usersDb[idx], ...this };
          return this;
        },
        canTransitionTo: (_s) => true,
        transitionTo: function (newStatus, opts) {
          this.status = newStatus;
          this.statusChangedAt = new Date();
          this.statusChangedBy = opts?.changedBy;
          return this;
        },
      };
      usersDb.push(user);

      const req = buildReq({ params: { id: "user-10" }, body: { reason: "Test" } });
      const res = buildRes();
      const next = vi.fn();

      await suspendUser(req, res, next);

      expect(activityLogDb.length).toBeGreaterThan(0);
      const log = activityLogDb[0];
      expect(log.action).toBe("user.suspend");
      expect(log.actor).toBe("admin-1");
      expect(log.targetUser).toBe("user-10");
    });
  });
});
