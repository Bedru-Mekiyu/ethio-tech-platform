import { describe, it, expect, vi } from "vitest";
import request from "supertest";
import { createApp } from "../app.js";
import User from "../models/User.js";
import Certificate from "../models/Certificate.js";
import jwt from "jsonwebtoken";
import { getEnv } from "../config/env.js";

describe("Mentors Directory & Certificates Multi-Role Auth", () => {
  const app = createApp();
  const env = getEnv();

  const createToken = (user) => {
    return jwt.sign({ id: user._id, role: user.role }, env.jwtSecret, { expiresIn: "1h" });
  };

  it("allows unauthenticated or authenticated users to fetch mentors list via GET /api/v1/mentors", async () => {
    vi.spyOn(User, "find").mockReturnValue({
      select: vi.fn().mockReturnThis(),
      sort: vi.fn().mockReturnThis(),
      lean: vi.fn().mockResolvedValue([
        {
          _id: "64c8d1f2e1a3b5c6d7e8f903",
          fullName: "Dr. Selamawit Tekle",
          role: "mentor",
          expertise: ["Cloud Architecture"],
          mentorRating: 4.9,
          totalSessions: 42,
        },
      ]),
    });

    const res = await request(app).get("/api/v1/mentors");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.mentors)).toBe(true);
    expect(res.body.data.mentors.length).toBe(1);
    expect(res.body.data.mentors[0].fullName).toBe("Dr. Selamawit Tekle");
  });

  it("allows parent to fetch certificates via GET /api/v1/certificates", async () => {
    const parentId = "64c8d1f2e1a3b5c6d7e8f901";
    const studentId = "64c8d1f2e1a3b5c6d7e8f902";

    vi.spyOn(User, "findById").mockReturnValue({
      select: vi.fn().mockResolvedValue({
        _id: parentId,
        role: "parent",
        status: "active",
        linkedStudents: [studentId],
      }),
    });

    vi.spyOn(Certificate, "find").mockReturnValue({
      sort: vi.fn().mockReturnThis(),
      populate: vi.fn().mockReturnThis(),
      then: vi.fn().mockImplementation((resolve) => resolve([])),
    });

    const token = createToken({ _id: parentId, role: "parent" });
    const res = await request(app)
      .get("/api/v1/certificates")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.certificates)).toBe(true);
  });
});
