import { describe, it, expect, beforeAll, afterAll } from "vitest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import User from "../models/User.js";
import { loginUser, refreshAccessToken } from "../services/authService.js";

describe("refresh token security", () => {
  let mongo;

  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    await mongoose.connect(mongo.getUri());
    process.env.JWT_SECRET = "test-jwt-secret-min-16-chars";
    process.env.JWT_REFRESH_SECRET = "test-refresh-secret-min-16";
  });

  afterAll(async () => {
    await mongoose.connection.close();
    await mongo.stop();
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
      await expect(loginUser({ email: "lockout@test.com", password: "WrongPassword" })).rejects.toThrow("Invalid credentials");
    }

    // 10th attempt locks the account
    await expect(loginUser({ email: "lockout@test.com", password: "WrongPassword" })).rejects.toThrow("Invalid credentials");

    // 11th attempt should throw locked error (403 status code)
    await expect(loginUser({ email: "lockout@test.com", password: "Password123" })).rejects.toMatchObject({
      statusCode: 403,
    });
  });
});
