import { beforeEach, describe, expect, it, vi } from "vitest";
import { registerUser } from "../services/authService.js";
import { requireVerifiedMentor } from "../middlewares/authMiddleware.js";
import { submitMentorApplication } from "../controllers/mentorApplicationController.js";
import { reviewMentorApplication } from "../controllers/adminController.js";

const applicationsDb = [];
const usersDb = [];
const notificationsDb = [];
const adminActivityLogsDb = [];

const buildQuery = (result) => {
  const query = {
    sort: () => query,
    select: () => query,
    then: (onFulfill) => Promise.resolve(result).then(onFulfill),
    catch: (onReject) => Promise.resolve(result).catch(onReject),
  };
  return query;
};

vi.mock("../models/MentorApplication.js", () => ({
  default: {
    findOne: (query) => {
      const match = (app) => {
        if (query.email && app.email !== query.email) return false;
        if (query.status) {
          if (typeof query.status === "string" && app.status !== query.status) return false;
          if (Array.isArray(query.status?.$in) && !query.status.$in.includes(app.status)) return false;
        }
        return true;
      };
      const record = applicationsDb.find(match) ?? null;
      return buildQuery(record);
    },
    findById: async (id) => {
      const found = applicationsDb.find((item) => item._id === id);
      if (!found) return null;
      return {
        ...found,
        save: async function () {
          const idx = applicationsDb.findIndex((item) => item._id === id);
          if (idx !== -1) {
            Object.assign(applicationsDb[idx], this);
          }
          return this;
        },
        toObject: () => ({ ...found }),
      };
    },
    create: async (payload) => {
      const doc = { _id: `application-${applicationsDb.length + 1}`, status: "pending", ...payload };
      applicationsDb.push(doc);
      return doc;
    },
  },
}));

vi.mock("../models/User.js", () => ({
  default: {
    findOne: (query) => {
      if (typeof query === "object" && query !== null) {
        const email = query.email?.toLowerCase ? query.email.toLowerCase() : query.email;
        const found = usersDb.find((user) => user.email === email) ?? null;
        if (found) {
          const doc = {
            ...found,
            _doc: { ...found },
            save: async function () {
              const idx = usersDb.findIndex((u) => u._id === this._id);
              if (idx !== -1) usersDb[idx] = { ...usersDb[idx], ...this };
              return this;
            },
            toObject: () => ({ ...found, ...this }),
          };
          return buildQuery(doc);
        }
        return buildQuery(null);
      }
      return buildQuery(null);
    },
    find: (query) => {
      const filtered = usersDb.filter((user) => user.role === query.role);
      return buildQuery(filtered);
    },
    findById: async (id) => {
      const found = usersDb.find((u) => u._id === id);
      if (!found) return null;
      return found;
    },
    create: async (payload) => {
      const doc = {
        _id: `user-${usersDb.length + 1}`,
        ...payload,
        email: payload.email?.toLowerCase(),
        save: async function () {
          const index = usersDb.findIndex((item) => item._id === this._id);
          if (index !== -1) usersDb[index] = this;
          return this;
        },
      };
      usersDb.push(doc);
      return doc;
    },
    findByIdAndUpdate: async (_query, _update) => null,
    countDocuments: async (query) => {
      return usersDb.filter((u) => {
        if (query?.role && u.role !== query.role) return false;
        if (query?.email && u.email !== query.email) return false;
        if (query?.deletedAt !== undefined && query.deletedAt !== null) {
          if (query.deletedAt.$ne === null && u.deletedAt) return false;
          if (query.deletedAt === null && u.deletedAt) return false;
        }
        return true;
      }).length;
    },
  },
}));

vi.mock("../models/Notification.js", () => ({
  default: {
    create: async (payload) => {
      notificationsDb.push(payload);
      return payload;
    },
    insertMany: async (payload) => {
      notificationsDb.push(...payload);
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
});

describe("onboarding architecture", () => {
  beforeEach(() => {
    applicationsDb.length = 0;
    usersDb.length = 0;
    notificationsDb.length = 0;
    adminActivityLogsDb.length = 0;
  });

  it("always creates student accounts from public registration", async () => {
    const user = await registerUser({
      fullName: "Student One",
      email: "student1@example.com",
      password: "Password123",
      role: "mentor",
      gradeLevel: 10,
      city: "Addis Ababa",
      learningInterests: ["Web", "AI"],
    });

    expect(user.role).toBe("student");
    expect(user.city).toBe("Addis Ababa");
    expect(user.learningInterests).toEqual(["Web", "AI"]);
  });

  it("submits mentor applications as pending without creating mentor accounts", async () => {
    usersDb.push({ _id: "admin-1", role: "admin", email: "admin@example.com" });
    const res = buildRes();
    const next = vi.fn();

    await submitMentorApplication(
      {
        body: {
          fullName: "Mentor Candidate",
          email: "mentor@example.com",
          currentRole: "Senior Engineer",
          expertise: ["Frontend", "Backend"],
          mentoringStyle: ["live-sessions"],
          whyMentor: "I want to help students gain practical skills and confidence.",
          consent: true,
        },
      },
      res,
      next
    );

    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(201);
    expect(res.body.data.application.status).toBe("pending");
    expect(usersDb.find((user) => user.email === "mentor@example.com" && user.role === "mentor")).toBeFalsy();
  });

  it("approves mentor applications and updates existing mentor status", async () => {
    const mentorUser = {
      _id: "mentor-1",
      role: "mentor",
      email: "mentor@example.com",
      isVerified: false,
      mentorStatus: "pending",
      status: "pending",
      save: async function () {
        const index = usersDb.findIndex((item) => item._id === this._id);
        if (index !== -1) usersDb[index] = { ...usersDb[index], ...this };
        return this;
      },
    };
    usersDb.push(mentorUser);
    applicationsDb.push({
      _id: "application-1",
      email: "mentor@example.com",
      status: "pending",
      expertise: ["Frontend", "Backend"],
      currentCompany: "EthioTech Labs",
      whyMentor: "Helping students build meaningful projects.",
      toObject: () => ({
        _id: "application-1",
        email: "mentor@example.com",
        status: "pending",
      }),
    });
    const res = buildRes();
    const next = vi.fn();

    await reviewMentorApplication(
      {
        params: { id: "application-1" },
        body: { status: "approved", reviewedNotes: "Strong profile and availability." },
        user: { _id: "admin-1" },
        ip: "127.0.0.1",
        headers: { "user-agent": "test" },
      },
      res,
      next
    );

    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(200);
    const mentor = usersDb.find((user) => user._id === "mentor-1");
    expect(mentor?.isVerified).toBe(true);
    expect(mentor?.mentorStatus).toBe("approved");
  });

  it("rejects mentor applications and updates mentor status accordingly", async () => {
    const mentorUser = {
      _id: "mentor-2",
      role: "mentor",
      email: "mentor2@example.com",
      isVerified: true,
      mentorStatus: "approved",
      status: "active",
      save: async function () {
        const index = usersDb.findIndex((item) => item._id === this._id);
        if (index !== -1) usersDb[index] = { ...usersDb[index], ...this };
        return this;
      },
    };
    usersDb.push(mentorUser);
    applicationsDb.push({
      _id: "application-2",
      email: "mentor2@example.com",
      status: "pending",
      expertise: ["Cloud", "DevOps"],
      currentCompany: "Cloud Hub",
      whyMentor: "I mentor to improve career outcomes for new developers.",
      toObject: () => ({
        _id: "application-2",
        email: "mentor2@example.com",
        status: "pending",
      }),
    });
    const res = buildRes();
    const next = vi.fn();

    await reviewMentorApplication(
      {
        params: { id: "application-2" },
        body: { status: "rejected", reviewedNotes: "Experience does not match current cohort needs." },
        user: { _id: "admin-1" },
        ip: "127.0.0.1",
        headers: { "user-agent": "test" },
      },
      res,
      next
    );

    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(200);
    const mentor = usersDb.find((user) => user._id === "mentor-2");
    expect(mentor?.isVerified).toBe(false);
    expect(mentor?.mentorStatus).toBe("rejected");
  });

  it("protects mentor tools for unverified mentors", () => {
    const next = vi.fn();

    requireVerifiedMentor(
      { user: { role: "mentor", isVerified: false } },
      {},
      next
    );
    const firstCallArg = next.mock.calls[0][0];
    expect(firstCallArg?.statusCode).toBe(403);

    requireVerifiedMentor(
      { user: { role: "mentor", isVerified: true } },
      {},
      next
    );
    expect(next).toHaveBeenCalledTimes(2);
    expect(next.mock.calls[1][0]).toBeUndefined();
  });
});
