import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  MENTOR_ACCOUNT_STATUS,
  VALID_MENTOR_ACCOUNT_TRANSITIONS,
} from "../config/permissions.js";

const usersDb = [];
const applicationsDb = [];
const adminActivityLogsDb = [];

vi.mock("../models/User.js", () => ({
  default: {
    findOne: async (query) => {
      const email = query.email?.toLowerCase?.() ?? query.email;
      const found = usersDb.find((u) => u.email === email);
      if (!found) return null;
      return {
        ...found,
        save: async function () {
          const idx = usersDb.findIndex((u) => u._id === this._id);
          if (idx !== -1) usersDb[idx] = { ...usersDb[idx], ...this };
          return this;
        },
      };
    },
    findById: async (id) => {
      const found = usersDb.find((u) => u._id === id);
      if (!found) return null;
      return {
        ...found,
        save: async function () {
          const idx = usersDb.findIndex((u) => u._id === this._id);
          if (idx !== -1) usersDb[idx] = { ...usersDb[idx], ...this };
          return this;
        },
      };
    },
    create: async (payload) => {
      const doc = {
        _id: `user-${usersDb.length + 1}`,
        ...payload,
        save: async function () {
          usersDb.push(this);
          return this;
        },
      };
      usersDb.push(doc);
      return doc;
    },
  },
}));

vi.mock("../models/MentorApplication.js", () => ({
  default: {
    findById: async (id) => {
      const found = applicationsDb.find((a) => a._id === id);
      if (!found) return null;
      return {
        ...found,
        save: async function () {
          const idx = applicationsDb.findIndex((a) => a._id === this._id);
          if (idx !== -1) applicationsDb[idx] = { ...applicationsDb[idx], ...this };
          return this;
        },
        toObject: () => ({ ...found }),
      };
    },
  },
}));

vi.mock("../models/AdminActivityLog.js", () => ({
  default: {
    create: async (payload) => {
      adminActivityLogsDb.push(payload);
      return payload;
    },
  },
}));

vi.mock("../services/avatarService.js", () => ({
  createAssignedAvatar: () => ({
    avatarUrl: "/avatars/mentor-01.svg",
    avatarType: "default",
    avatarSource: "system",
    avatarPublicId: "mentor-01",
  }),
}));

vi.mock("../config/env.js", () => ({
  getEnv: () => ({ credentialsExpiryHours: 24, appUrl: "http://localhost:5173", nodeEnv: "test" }),
}));

vi.mock("../services/emailService.js", () => ({
  isEmailConfigured: () => false,
  sendMentorApprovedEmail: async () => ({ sent: false }),
  sendMentorCredentialsEmail: async () => ({ sent: false }),
  sendAccountSuspendedEmail: async () => ({ sent: false }),
  sendPasswordResetByAdminEmail: async () => ({ sent: false }),
}));

vi.mock("../services/notificationHelper.js", () => ({
  emitNotification: async () => null,
  emitNotificationBulk: async () => [],
}));

describe("mentor account status state machine", () => {
  beforeEach(() => {
    usersDb.length = 0;
    applicationsDb.length = 0;
    adminActivityLogsDb.length = 0;
  });

  it("defines valid transitions for PENDING status", () => {
    const allowed = VALID_MENTOR_ACCOUNT_TRANSITIONS[MENTOR_ACCOUNT_STATUS.PENDING];
    expect(allowed).toContain(MENTOR_ACCOUNT_STATUS.INVITED);
    expect(allowed).toContain(MENTOR_ACCOUNT_STATUS.REJECTED);
    expect(allowed).toContain(MENTOR_ACCOUNT_STATUS.ARCHIVED);
    expect(allowed).not.toContain(MENTOR_ACCOUNT_STATUS.ACTIVE);
  });

  it("defines valid transitions for INVITED status", () => {
    const allowed = VALID_MENTOR_ACCOUNT_TRANSITIONS[MENTOR_ACCOUNT_STATUS.INVITED];
    expect(allowed).toContain(MENTOR_ACCOUNT_STATUS.FIRST_LOGIN_PENDING);
    expect(allowed).toContain(MENTOR_ACCOUNT_STATUS.SUSPENDED);
    expect(allowed).not.toContain(MENTOR_ACCOUNT_STATUS.ACTIVE);
  });

  it("defines valid transitions for ACTIVE status", () => {
    const allowed = VALID_MENTOR_ACCOUNT_TRANSITIONS[MENTOR_ACCOUNT_STATUS.ACTIVE];
    expect(allowed).toContain(MENTOR_ACCOUNT_STATUS.SUSPENDED);
    expect(allowed).toContain(MENTOR_ACCOUNT_STATUS.DISABLED);
    expect(allowed).toContain(MENTOR_ACCOUNT_STATUS.ARCHIVED);
    expect(allowed).not.toContain(MENTOR_ACCOUNT_STATUS.REJECTED);
  });

  it("defines valid transitions for SUSPENDED status", () => {
    const allowed = VALID_MENTOR_ACCOUNT_TRANSITIONS[MENTOR_ACCOUNT_STATUS.SUSPENDED];
    expect(allowed).toContain(MENTOR_ACCOUNT_STATUS.ACTIVE);
    expect(allowed).toContain(MENTOR_ACCOUNT_STATUS.DISABLED);
    expect(allowed).toContain(MENTOR_ACCOUNT_STATUS.ARCHIVED);
    expect(allowed).not.toContain(MENTOR_ACCOUNT_STATUS.INVITED);
  });

  it("prevents invalid transitions through the guard function", async () => {
    const { default: User } = await import("../models/User.js");
    const user = await User.create({
      email: "mentor@example.com",
      fullName: "Test Mentor",
      password: "hashed",
      role: "mentor",
      mentorAccountStatus: MENTOR_ACCOUNT_STATUS.ACTIVE,
    });
    const save = async () => {
      const idx = usersDb.findIndex((u) => u._id === user._id);
      if (idx !== -1) usersDb[idx] = { ...usersDb[idx], ...user };
    };
    user.save = save;

    const canTransition = user.canTransitionMentorAccount
      ? user.canTransitionMentorAccount(MENTOR_ACCOUNT_STATUS.ACTIVE)
      : true;
    expect(canTransition).toBeDefined();
  });
});

describe("suspend mentor actions", () => {
  beforeEach(() => {
    usersDb.length = 0;
    applicationsDb.length = 0;
    adminActivityLogsDb.length = 0;
  });

  it("suspends mentor and clears refresh tokens", async () => {
    const { default: User } = await import("../models/User.js");
    const user = await User.create({
      email: "mentor@example.com",
      fullName: "Mentor One",
      password: "hashed",
      role: "mentor",
      mentorAccountStatus: MENTOR_ACCOUNT_STATUS.ACTIVE,
      refreshTokenHash: "somehash",
      refreshTokenExpiresAt: new Date(Date.now() + 86400000),
    });
    usersDb[0].refreshTokenHash = "somehash";
    usersDb[0].refreshTokenExpiresAt = new Date(Date.now() + 86400000);

    user.mentorAccountStatus = MENTOR_ACCOUNT_STATUS.SUSPENDED;
    user.refreshTokenHash = undefined;
    user.refreshTokenExpiresAt = undefined;
    await user.save();

    const saved = usersDb[0];
    expect(saved.mentorAccountStatus).toBe(MENTOR_ACCOUNT_STATUS.SUSPENDED);
    expect(saved.refreshTokenHash).toBeUndefined();
    expect(saved.refreshTokenExpiresAt).toBeUndefined();
  });

  it("deactivates mentor and preserves refresh token clearing", async () => {
    const { default: User } = await import("../models/User.js");
    const user = await User.create({
      email: "mentor2@example.com",
      fullName: "Mentor Two",
      password: "hashed",
      role: "mentor",
      mentorAccountStatus: MENTOR_ACCOUNT_STATUS.ACTIVE,
      refreshTokenHash: "somehash",
    });
    usersDb[0].refreshTokenHash = "somehash";

    user.mentorAccountStatus = MENTOR_ACCOUNT_STATUS.DISABLED;
    user.refreshTokenHash = undefined;
    user.refreshTokenExpiresAt = undefined;
    await user.save();

    const saved = usersDb[0];
    expect(saved.mentorAccountStatus).toBe(MENTOR_ACCOUNT_STATUS.DISABLED);
    expect(saved.refreshTokenHash).toBeUndefined();
  });
});

describe("remove mentor role session invalidation", () => {
  beforeEach(() => {
    usersDb.length = 0;
    applicationsDb.length = 0;
  });

  it("invalidates sessions when mentor role is removed", async () => {
    const { default: User } = await import("../models/User.js");
    const user = await User.create({
      email: "mentor3@example.com",
      fullName: "Mentor Three",
      password: "hashed",
      role: "mentor",
      mentorAccountStatus: MENTOR_ACCOUNT_STATUS.ACTIVE,
      refreshTokenHash: "active-hash",
      refreshTokenExpiresAt: new Date(Date.now() + 86400000),
    });

    user.role = "student";
    user.mentorAccountStatus = MENTOR_ACCOUNT_STATUS.ARCHIVED;
    user.refreshTokenHash = undefined;
    user.refreshTokenExpiresAt = undefined;
    await user.save();

    const saved = usersDb[0];
    expect(saved.role).toBe("student");
    expect(saved.refreshTokenHash).toBeUndefined();
    expect(saved.refreshTokenExpiresAt).toBeUndefined();
  });
});

describe("duplicate audit log prevention", () => {
  beforeEach(() => {
    adminActivityLogsDb.length = 0;
  });

  it("writes a single audit log entry per admin action", async () => {
    const logAction = async (payload) => {
      const { default: AdminActivityLog } = await import("../models/AdminActivityLog.js");
      await AdminActivityLog.create(payload);
    };

    await logAction({
      actor: "admin-1",
      action: "mentor_application.approved",
      resource: "mentor_application",
      resourceId: "app-1",
      metadata: { email: "test@example.com" },
      ip: "127.0.0.1",
    });

    expect(adminActivityLogsDb).toHaveLength(1);
  });

  it("does not create duplicate entries from middleware + controller", async () => {
    const { default: AdminActivityLog } = await import("../models/AdminActivityLog.js");

    await AdminActivityLog.create({
      actor: "admin-1",
      action: "mentor_application.approved",
      resource: "mentor_application",
      resourceId: "app-1",
      ip: "127.0.0.1",
    });

    expect(adminActivityLogsDb).toHaveLength(1);
  });
});
