import { beforeEach, describe, expect, it, vi } from "vitest";
import { submitMentorApplication } from "../controllers/mentorApplicationController.js";
import { APPLICATION_STATUS } from "../config/permissions.js";

const applicationsDb = [];

const buildQuery = (result) => ({
  sort: () => buildQuery(result),
  then: (onfulfill) => Promise.resolve(result).then(onfulfill),
});

vi.mock("../models/MentorApplication.js", () => ({
  default: {
    findOne: (query) => {
      const match = applicationsDb.find((app) => {
        if (query.email && app.email !== query.email) return false;
        if (query.status?.$in && !query.status.$in.includes(app.status)) return false;
        if (typeof query.status === "string" && app.status !== query.status) return false;
        return true;
      });
      return buildQuery(match ?? null);
    },
    create: async (payload) => {
      const doc = {
        _id: `app-${applicationsDb.length + 1}`,
        status: APPLICATION_STATUS.PENDING_REVIEW,
        ...payload,
      };
      applicationsDb.push(doc);
      return doc;
    },
  },
}));

vi.mock("../models/User.js", () => ({
  default: {
    findOne: () => buildQuery(null),
    find: () => buildQuery([]),
  },
}));

vi.mock("../services/notificationService.js", () => ({
  notifyUser: vi.fn(),
  notifyMentorApplicationReceived: vi.fn(),
}));

vi.mock("../services/emailService.js", () => ({
  sendMentorApplicationReceivedEmail: vi.fn().mockResolvedValue({ sent: false }),
}));

const buildRes = () => {
  const res = { statusCode: 200, body: null };
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
  res.json = (body) => {
    res.body = body;
    return res;
  };
  return res;
};

describe("mentor application duplicate prevention", () => {
  beforeEach(() => {
    applicationsDb.length = 0;
  });

  it("blocks duplicate pending_review applications", async () => {
    applicationsDb.push({
      _id: "existing",
      email: "applicant@example.com",
      status: APPLICATION_STATUS.PENDING_REVIEW,
    });

    const res = buildRes();
    const next = vi.fn();

    await submitMentorApplication(
      {
        body: {
          fullName: "Applicant",
          email: "applicant@example.com",
          currentRole: "Engineer",
          expertise: ["React", "Node"],
          mentoringStyle: ["live-sessions"],
          whyMentor: "I want to mentor students in my community.",
          consent: true,
        },
      },
      res,
      next
    );

    expect(next).toHaveBeenCalled();
    expect(next.mock.calls[0][0]?.statusCode).toBe(409);
  });

  it("creates application with pending_review status", async () => {
    const res = buildRes();
    const next = vi.fn();

    await submitMentorApplication(
      {
        body: {
          fullName: "Applicant",
          email: "new@example.com",
          currentRole: "Engineer",
          expertise: ["React", "Node"],
          mentoringStyle: ["live-sessions"],
          whyMentor: "I want to mentor students in my community.",
          consent: true,
        },
      },
      res,
      next
    );

    expect(next).not.toHaveBeenCalled();
    expect(res.body.data.application.status).toBe(APPLICATION_STATUS.PENDING_REVIEW);
  });
});
