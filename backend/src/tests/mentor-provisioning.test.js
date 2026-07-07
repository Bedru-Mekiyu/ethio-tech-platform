import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  generateSecurePassword,
  provisionOnApproval,
  upgradeExistingUser,
} from "../services/mentorProvisioningService.js";
import { ROLES, MENTOR_STATUS, MENTOR_ACCOUNT_STATUS } from "../config/permissions.js";

const usersDb = [];
const applicationsDb = [];

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
    create: async (payload) => {
      const doc = {
        _id: `user-${usersDb.length + 1}`,
        ...payload,
        email: payload.email.toLowerCase(),
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

vi.mock("../services/avatarService.js", () => ({
  createAssignedAvatar: () => ({
    avatarUrl: "/avatars/mentor-01.svg",
    avatarType: "default",
    avatarSource: "system",
    avatarPublicId: "mentor-01",
  }),
}));

vi.mock("../config/env.js", () => ({
  getEnv: () => ({ credentialsExpiryHours: 24 }),
}));

describe("mentor provisioning service", () => {
  beforeEach(() => {
    usersDb.length = 0;
    applicationsDb.length = 0;
  });

  it("generates secure passwords without predictable patterns", () => {
    const a = generateSecurePassword();
    const b = generateSecurePassword();
    expect(a.length).toBeGreaterThanOrEqual(16);
    expect(a).not.toBe(b);
  });

  it("upgrades existing student to mentor while preserving identity", async () => {
    usersDb.push({
      _id: "student-1",
      email: "mentor@example.com",
      role: ROLES.STUDENT,
      xp: 500,
      mentorStatus: MENTOR_STATUS.PENDING,
      expertise: [],
      save: async function () {
        const idx = usersDb.findIndex((u) => u._id === this._id);
        if (idx !== -1) usersDb[idx] = { ...usersDb[idx], ...this };
        return this;
      },
    });

    const application = {
      _id: "app-1",
      email: "mentor@example.com",
      expertise: ["React", "Node"],
      currentCompany: "EthioTech",
      whyMentor: "Give back",
      save: async function () {
        return this;
      },
    };

    const { user, roleUpgraded } = await upgradeExistingUser(
      usersDb[0],
      application,
      "admin-1"
    );

    expect(roleUpgraded).toBe(true);
    expect(user.role).toBe(ROLES.MENTOR);
    expect(user.mentorStatus).toBe(MENTOR_STATUS.APPROVED);
    expect(user.mentorAccountStatus).toBe(MENTOR_ACCOUNT_STATUS.INVITED);
    expect(user.mustChangePassword).toBe(true);
    expect(user.xp).toBe(500);
    expect(user.expertise).toEqual(["React", "Node"]);
  });

  it("creates mentor user when no account exists", async () => {
    const application = {
      _id: "app-2",
      email: "newmentor@example.com",
      fullName: "New Mentor",
      expertise: ["Python", "ML"],
      currentCompany: "AI Lab",
      whyMentor: "Teaching",
      save: async function () {
        return this;
      },
    };

    const result = await provisionOnApproval({ application, actorId: "admin-1" });

    expect(result.accountCreated).toBe(true);
    expect(result.user.role).toBe(ROLES.MENTOR);
    expect(result.tempPassword).toBeTruthy();
    expect(application.userId).toBe(result.user._id);
  });
});
