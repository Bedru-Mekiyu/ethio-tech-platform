import { describe, it, expect, beforeAll, vi } from "vitest";
import { loginUser, refreshAccessToken } from "../services/authService.js";
import User from "../models/User.js";

// Simple in-memory database for users in testing
const usersDb = [];

vi.mock("../models/User.js", () => {
  return {
    default: {
      create: async (data) => {
        const userInstance = {
          _id: `mock-user-${Date.now()}-${Math.random()}`,
          fullName: data.fullName,
          email: data.email?.toLowerCase(),
          password: data.password,
          role: data.role || "student",
          gradeLevel: data.gradeLevel,
          loginAttempts: data.loginAttempts ?? 0,
          lockUntil: data.lockUntil,
          refreshTokenHash: data.refreshTokenHash,
          refreshTokenExpiresAt: data.refreshTokenExpiresAt,
          save: async function () {
            // Find and update inside the mock database
            const idx = usersDb.findIndex((u) => u._id === this._id);
            if (idx !== -1) {
              usersDb[idx] = this;
            }
            return this;
          },
        };
        usersDb.push(userInstance);
        return userInstance;
      },
      findOne: (query) => {
        let found = null;
        if (query.email) {
          found = usersDb.find((u) => u.email === query.email.toLowerCase());
        } else if (query.passwordResetHash) {
          found = usersDb.find((u) => u.passwordResetHash === query.passwordResetHash);
        } else {
          // generic fallback search
          found = usersDb.find((u) =>
            Object.keys(query).every((k) => u[k] === query[k])
          );
        }

        const queryObj = {
          select: () => queryObj,
          then: (onFulfilled) => Promise.resolve(found).then(onFulfilled),
          catch: (onRejected) => Promise.resolve(found).catch(onRejected),
        };
        return queryObj;
      },
      findById: (id) => {
        const found = usersDb.find((u) => u._id === id);
        const queryObj = {
          select: () => queryObj,
          then: (onFulfilled) => Promise.resolve(found).then(onFulfilled),
        };
        return queryObj;
      },
    },
  };
});

describe("refresh token security", () => {
  beforeAll(() => {
    process.env.JWT_SECRET = "test-jwt-secret-min-16-chars";
    process.env.JWT_REFRESH_SECRET = "test-refresh-secret-min-16";
  });

  it("detects refresh token reuse and clears session", async () => {
    const bcrypt = await import("bcryptjs");
    await User.create({
      fullName: "Reuse Test",
      email: "reuse@test.com",
      password: await bcrypt.hash("Password1", 10),
      role: "student",
    });

    const { refreshToken: firstRefresh } = await loginUser({
      email: "reuse@test.com",
      password: "Password1",
    });

    const rotated = await refreshAccessToken(firstRefresh);

    await expect(refreshAccessToken(firstRefresh)).rejects.toMatchObject({
      statusCode: 401,
    });

    const stored = await User.findOne({ email: "reuse@test.com" }).select(
      "+refreshTokenHash +refreshTokenExpiresAt"
    );
    expect(stored?.refreshTokenHash).toBeFalsy();

    expect(rotated.refreshToken).toBeTruthy();
  });

  it("locks account after 10 failed login attempts", async () => {
    const bcrypt = await import("bcryptjs");
    await User.create({
      fullName: "Lockout Test",
      email: "lockout@test.com",
      password: await bcrypt.hash("Password123", 10),
      role: "student",
    });

    // Perform 9 failed attempts
    for (let i = 0; i < 9; i++) {
      await expect(
        loginUser({ email: "lockout@test.com", password: "WrongPassword" })
      ).rejects.toThrow("Invalid credentials");
    }

    // 10th attempt locks the account
    await expect(
      loginUser({ email: "lockout@test.com", password: "WrongPassword" })
    ).rejects.toThrow("Invalid credentials");

    // 11th attempt should throw locked error (403 status code)
    await expect(
      loginUser({ email: "lockout@test.com", password: "Password123" })
    ).rejects.toMatchObject({
      statusCode: 403,
    });
  });
});
