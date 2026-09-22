import { describe, it, expect, beforeAll, afterAll } from "vitest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import { seedRoleUsers } from "../scripts/seed-roles.js";
import { loginUser } from "../services/authService.js";
import { ROLES, ROLE_HIERARCHY, USER_STATUS, MENTOR_STATUS, MENTOR_ACCOUNT_STATUS } from "../config/permissions.js";

describe("Role Seeding & Multi-Role Authentication Suite", () => {
  let mongoServer;

  beforeAll(async () => {
    process.env.NODE_ENV = "test";
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);

    // Seed canonical accounts
    await seedRoleUsers({ verbose: false });
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  describe("Role Definitions and Permissions", () => {
    it("includes parent in ROLES and ROLE_HIERARCHY", () => {
      expect(ROLES.PARENT).toBe("parent");
      expect(ROLE_HIERARCHY.parent).toBe(10);
      expect(ROLE_HIERARCHY.super_admin).toBe(100);
      expect(ROLE_HIERARCHY.admin).toBe(80);
      expect(ROLE_HIERARCHY.support).toBe(40);
    });
  });

  describe("Database Records Verification", () => {
    const canonicalRoles = [
      { email: "superadmin@ethiotech.com", role: ROLES.SUPER_ADMIN },
      { email: "super_admin@ethiotech.com", role: ROLES.SUPER_ADMIN },
      { email: "admin@ethiotech.com", role: ROLES.ADMIN },
      { email: "moderator@ethiotech.com", role: ROLES.MODERATOR },
      { email: "reviewer@ethiotech.com", role: ROLES.REVIEWER },
      { email: "support@ethiotech.com", role: ROLES.SUPPORT },
      { email: "mentor@ethiotech.com", role: ROLES.MENTOR },
      { email: "student@ethiotech.com", role: ROLES.STUDENT },
      { email: "parent@ethiotech.com", role: ROLES.PARENT },
    ];

    it.each(canonicalRoles)(
      "seeded account $email exists with active status and valid password",
      async ({ email, role }) => {
        const user = await User.findOne({ email }).select("+password");
        expect(user).toBeTruthy();
        expect(user.role).toBe(role);
        expect(user.status).toBe(USER_STATUS.ACTIVE);
        expect(user.isVerified).toBe(true);

        // Verify bcrypt password hash
        const isMatch = await bcrypt.compare("Passw0rd!", user.password);
        expect(isMatch).toBe(true);
      },
    );

    it("mentor account has all onboarding flags pre-approved", async () => {
      const mentor = await User.findOne({ email: "mentor@ethiotech.com" });
      expect(mentor.mentorStatus).toBe(MENTOR_STATUS.APPROVED);
      expect(mentor.mentorAccountStatus).toBe(MENTOR_ACCOUNT_STATUS.ACTIVE);
      expect(mentor.termsAcceptedAt).toBeInstanceOf(Date);
      expect(mentor.onboardingCompletedAt).toBeInstanceOf(Date);
      expect(mentor.onboardingSteps?.profileCompleted).toBe(true);
      expect(mentor.onboardingSteps?.termsAccepted).toBe(true);
    });

    it("parent account links to the seeded student account", async () => {
      const [parent, student] = await Promise.all([
        User.findOne({ email: "parent@ethiotech.com" }),
        User.findOne({ email: "student@ethiotech.com" }),
      ]);

      expect(parent.linkedStudents).toBeDefined();
      expect(parent.linkedStudents.map((id) => id.toString())).toContain(student._id.toString());
    });
  });

  describe("Real Auth Service Authentication Across All Roles", () => {
    const rolesToTest = [
      { email: "superadmin@ethiotech.com", expectedRole: "super_admin" },
      { email: "super_admin@ethiotech.com", expectedRole: "super_admin" },
      { email: "admin@ethiotech.com", expectedRole: "admin" },
      { email: "moderator@ethiotech.com", expectedRole: "moderator" },
      { email: "reviewer@ethiotech.com", expectedRole: "reviewer" },
      { email: "support@ethiotech.com", expectedRole: "support" },
      { email: "mentor@ethiotech.com", expectedRole: "mentor" },
      { email: "student@ethiotech.com", expectedRole: "student" },
      { email: "parent@ethiotech.com", expectedRole: "parent" },
    ];

    it.each(rolesToTest)(
      "authenticates $email and issues valid JWT with $expectedRole claim",
      async ({ email, expectedRole }) => {
        const result = await loginUser({ email, password: "Passw0rd!", ip: "127.0.0.1" });

        expect(result).toBeDefined();
        expect(result.accessToken).toBeTruthy();
        expect(result.refreshToken).toBeTruthy();
        expect(result.user).toBeDefined();
        expect(result.user.email).toBe(email);
        expect(result.user.role).toBe(expectedRole);
        expect(result.user.status).toBe(USER_STATUS.ACTIVE);

        if (expectedRole === "mentor") {
          expect(result.authFlags.requiresOnboarding).toBe(false);
          expect(result.authFlags.requiresTermsAcceptance).toBe(false);
        }
      },
    );

    it("rejects login with invalid password", async () => {
      await expect(
        loginUser({ email: "admin@ethiotech.com", password: "WrongPassword999!", ip: "127.0.0.1" }),
      ).rejects.toThrow("Invalid credentials");
    });

    it("rejects login with non-existent email", async () => {
      await expect(
        loginUser({ email: "doesnotexist@ethiotech.com", password: "Passw0rd!", ip: "127.0.0.1" }),
      ).rejects.toThrow("Invalid credentials");
    });
  });

  describe("Seed Idempotency", () => {
    it("re-running seed does not duplicate accounts or alter credentials", async () => {
      await seedRoleUsers({ verbose: false });

      const count = await User.countDocuments({
        email: {
          $in: [
            "superadmin@ethiotech.com",
            "super_admin@ethiotech.com",
            "admin@ethiotech.com",
            "moderator@ethiotech.com",
            "reviewer@ethiotech.com",
            "support@ethiotech.com",
            "mentor@ethiotech.com",
            "student@ethiotech.com",
            "parent@ethiotech.com",
          ],
        },
      });

      expect(count).toBe(9);

      // Still authenticates cleanly
      const loginResult = await loginUser({ email: "student@ethiotech.com", password: "Passw0rd!", ip: "127.0.0.1" });
      expect(loginResult.user.role).toBe("student");
    });
  });

  describe("Administrative User Management & Role Assignment Endpoints", () => {
    let app;
    let adminToken;
    let supportToken;
    let studentToken;

    beforeAll(async () => {
      const { createApp } = await import("../app.js");
      app = createApp();

      const [adminAuth, supportAuth, studentAuth] = await Promise.all([
        loginUser({ email: "admin@ethiotech.com", password: "Passw0rd!", ip: "127.0.0.1" }),
        loginUser({ email: "support@ethiotech.com", password: "Passw0rd!", ip: "127.0.0.1" }),
        loginUser({ email: "student@ethiotech.com", password: "Passw0rd!", ip: "127.0.0.1" }),
      ]);

      adminToken = adminAuth.accessToken;
      supportToken = supportAuth.accessToken;
      studentToken = studentAuth.accessToken;
    });

    it("allows admin to list users with 200 OK", async () => {
      const { default: request } = await import("supertest");
      const res = await request(app).get("/api/v1/admin/users").set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.items.length).toBeGreaterThanOrEqual(8);
    });

    it("allows support role to list users with 200 OK", async () => {
      const { default: request } = await import("supertest");
      const res = await request(app).get("/api/v1/admin/users").set("Authorization", `Bearer ${supportToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it("forbids student from accessing admin user management (403 Forbidden)", async () => {
      const { default: request } = await import("supertest");
      const res = await request(app).get("/api/v1/admin/users").set("Authorization", `Bearer ${studentToken}`);

      expect(res.status).toBe(403);
    });

    it("allows admin to create a new user via POST /api/v1/admin/users", async () => {
      const { default: request } = await import("supertest");
      const res = await request(app).post("/api/v1/admin/users").set("Authorization", `Bearer ${adminToken}`).send({
        fullName: "New Test Engineer",
        email: "new.engineer@ethiotech.com",
        password: "SecurePassword123!",
        role: "student",
        city: "Hawassa",
        gradeLevel: 10,
      });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe("new.engineer@ethiotech.com");
      expect(res.body.data.user.id).toBeDefined();

      // Verify the new user can authenticate
      const auth = await loginUser({
        email: "new.engineer@ethiotech.com",
        password: "SecurePassword123!",
        ip: "127.0.0.1",
      });
      expect(auth.user.fullName).toBe("New Test Engineer");
    });

    it("allows admin to update user profile via PATCH /api/v1/admin/users/:id", async () => {
      const { default: request } = await import("supertest");
      const user = await User.findOne({ email: "new.engineer@ethiotech.com" });

      const res = await request(app)
        .patch(`/api/v1/admin/users/${user._id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          fullName: "Updated Test Engineer",
          bio: "Updated engineer bio from admin test.",
          city: "Addis Ababa",
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.fullName).toBe("Updated Test Engineer");
      expect(res.body.data.user.city).toBe("Addis Ababa");
    });

    it("allows admin to assign the 'parent' role via PATCH /api/v1/admin/users/:id/role", async () => {
      const { default: request } = await import("supertest");
      const user = await User.findOne({ email: "new.engineer@ethiotech.com" });

      const res = await request(app)
        .patch(`/api/v1/admin/users/${user._id}/role`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ role: "parent" });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const updatedUser = await User.findById(user._id);
      expect(updatedUser.role).toBe("parent");
    });
  });
});
