import { beforeEach, describe, expect, it, vi } from "vitest";
import bcrypt from "bcryptjs";
import {
  activateAccountWithToken,
  firstLoginChangePassword,
  getOnboardingStatus,
  completeOnboarding,
} from "../services/authService.js";
import { MENTOR_ACCOUNT_STATUS } from "../config/permissions.js";
import crypto from "crypto";

const usersDb = [];

const hashToken = (token) => crypto.createHash("sha256").update(token).digest("hex");

vi.mock("../models/User.js", () => ({
  default: {
    findOne: (query) => {
      const chain = {
        select: async () => {
          if (query.activationTokenHash) {
            return (
              usersDb.find(
                (u) =>
                  u.activationTokenHash === query.activationTokenHash &&
                  u.activationTokenExpiresAt > new Date()
              ) ?? null
            );
          }
          return null;
        },
      };
      return chain;
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
  },
}));

vi.mock("../config/env.js", () => ({
  getEnv: () => ({ jwtSecret: "test", jwtRefreshSecret: "test", jwtExpiresIn: "1d", jwtRefreshDays: 14 }),
}));

describe("mentor first-login flows", () => {
  beforeEach(() => {
    usersDb.length = 0;
  });

  it("activates account with valid token and clears mustChangePassword", async () => {
    const token = "valid-activation-token";
    usersDb.push({
      _id: "mentor-1",
      role: "mentor",
      activationTokenHash: hashToken(token),
      activationTokenExpiresAt: new Date(Date.now() + 3600000),
      mustChangePassword: true,
      onboardingSteps: { passwordChanged: false },
      mentorAccountStatus: MENTOR_ACCOUNT_STATUS.INVITED,
      password: await bcrypt.hash("temp1234", 10),
    });

    const user = await activateAccountWithToken({ token, password: "NewPass123" });

    expect(user.mustChangePassword).toBe(false);
    expect(user.mentorAccountStatus).toBe(MENTOR_ACCOUNT_STATUS.ACTIVATED);
    expect(user.onboardingSteps.passwordChanged).toBe(true);
  });

  it("clears mustChangePassword on first login password change", async () => {
    usersDb.push({
      _id: "mentor-2",
      role: "mentor",
      mustChangePassword: true,
      mentorAccountStatus: MENTOR_ACCOUNT_STATUS.FIRST_LOGIN_PENDING,
      onboardingSteps: { passwordChanged: false },
      password: await bcrypt.hash("TempPass123", 10),
    });

    const user = await firstLoginChangePassword({
      userId: "mentor-2",
      currentPassword: "TempPass123",
      newPassword: "NewPass456",
    });

    expect(user.mustChangePassword).toBe(false);
    expect(user.mentorAccountStatus).toBe(MENTOR_ACCOUNT_STATUS.ACTIVATED);
  });

  it("requires all onboarding steps before completion", async () => {
    usersDb.push({
      _id: "mentor-3",
      role: "mentor",
      mustChangePassword: false,
      termsAcceptedAt: new Date(),
      bio: "Bio",
      expertise: ["A", "B"],
      currentCompany: "Co",
      avatarType: "uploaded",
      onboardingSteps: { availabilitySet: false },
    });

    await expect(completeOnboarding("mentor-3")).rejects.toMatchObject({ statusCode: 400 });

    const status = getOnboardingStatus(usersDb[0]);
    expect(status.profileCompleted).toBe(true);
    expect(status.availabilitySet).toBe(false);
  });
});
