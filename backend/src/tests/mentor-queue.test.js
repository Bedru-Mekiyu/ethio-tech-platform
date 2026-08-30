import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  getQueueApplications,
  getQueueStats,
  approveApplication,
  rejectApplication,
  requestChanges,
} from "../controllers/adminMentorController.js";
import { APPLICATION_STATUS, USER_STATUS, MENTOR_STATUS } from "../config/permissions.js";

const applicationsDb = [];
const usersDb = [];
const notificationsDb = [];
const adminActivityLogsDb = [];

const buildQuery = (result) => {
  const q = {
    sort: () => q,
    skip: () => q,
    limit: () => q,
    lean: async () => result,
    then: (onfulfill) => Promise.resolve(result).then(onfulfill),
  };
  return q;
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
      const doc = {
        ...found,
        save: async function () {
          const idx = applicationsDb.findIndex((item) => item._id === this._id);
          if (idx !== -1) Object.assign(applicationsDb[idx], this);
          return this;
        },
        toObject: () => ({ ...found, ...doc }),
      };
      return doc;
    },
    find: (filter) => {
      let filtered = applicationsDb.filter((app) => {
        for (const [key, val] of Object.entries(filter)) {
          if (key === "$or") {
            const matchesOr = val.some((condition) => {
              const [[k, v]] = Object.entries(condition);
              const regex = v.$regex;
              return app[k]?.toLowerCase().includes(regex.toLowerCase());
            });
            if (!matchesOr) return false;
          } else if (key === "createdAt") {
            if (val.$gte && new Date(app.createdAt) < new Date(val.$gte)) return false;
            if (val.$lte && new Date(app.createdAt) > new Date(val.$lte)) return false;
          } else if (key === "yearsExperience") {
            if (val.$gte !== undefined && (app.yearsExperience ?? 0) < val.$gte) return false;
            if (val.$lte !== undefined && (app.yearsExperience ?? 0) > val.$lte) return false;
          } else if (key === "expertise") {
            if (val.$in && !val.$in.some((e) => (app.expertise ?? []).includes(e))) return false;
          } else if (app[key] !== val) return false;
        }
        return true;
      });
      let skipCount = 0;
      let limitCount = 0;
      const q = {
        sort: () => q,
        skip: (n) => { skipCount = Number(n); return q; },
        limit: (n) => { limitCount = Number(n); return q; },
        lean: async () => {
          if (skipCount > 0 || limitCount > 0) {
            const start = skipCount;
            const end = limitCount > 0 ? start + limitCount : undefined;
            return filtered.slice(start, end);
          }
          return filtered;
        },
        then: (onfulfill) => {
          if (skipCount > 0 || limitCount > 0) {
            const start = skipCount;
            const end = limitCount > 0 ? start + limitCount : undefined;
            return Promise.resolve(filtered.slice(start, end)).then(onfulfill);
          }
          return Promise.resolve(filtered).then(onfulfill);
        },
      };
      return q;
    },
    countDocuments: async (filter) => {
      const count = applicationsDb.filter((app) => {
        for (const [key, val] of Object.entries(filter)) {
          if (key === "status" && app.status !== val) return false;
          if (key === "$or") {
            return val.some((condition) => {
              const [[k, v]] = Object.entries(condition);
              const regex = v.$regex;
              return app[k]?.toLowerCase().includes(regex.toLowerCase());
            });
          }
          if (key === "createdAt") {
            if (val.$gte && new Date(app.createdAt) < new Date(val.$gte)) return false;
            if (val.$lte && new Date(app.createdAt) > new Date(val.$lte)) return false;
          }
          if (key === "yearsExperience") {
            if (val.$gte !== undefined && (app.yearsExperience ?? 0) < val.$gte) return false;
            if (val.$lte !== undefined && (app.yearsExperience ?? 0) > val.$lte) return false;
          }
          if (key === "expertise") {
            if (val.$in && !val.$in.some((e) => (app.expertise ?? []).includes(e))) return false;
          }
        }
        return true;
      }).length;
      return count;
    },
    create: async (payload) => {
      const doc = { _id: `application-${applicationsDb.length + 1}`, status: APPLICATION_STATUS.PENDING_REVIEW, ...payload };
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
      const filtered = usersDb.filter((user) => {
        if (query.role?.$in) return query.role.$in.includes(user.role);
        if (query.role) return user.role === query.role;
        return true;
      });
      const q = {
        sort: () => q,
        select: () => q,
        then: (onfulfill) => Promise.resolve(filtered).then(onfulfill),
      };
      return q;
    },
    findById: async (id) => {
      const found = usersDb.find((u) => u._id === id);
      if (!found) return null;
      const doc = {
        ...found,
        save: async function () {
          const idx = usersDb.findIndex((u) => u._id === this._id);
          if (idx !== -1) usersDb[idx] = { ...usersDb[idx], ...this };
          return this;
        },
        select: function () { return doc; },
        lean: function () { return doc; },
      };
      doc.select = function () { return doc; };
      doc.lean = function () { return doc; };
      return doc;
    },
  },
}));

vi.mock("../models/NotificationPreference.js", () => ({
  default: {
    findOne: () => ({
      lean: async () => null,
    }),
  },
}));

vi.mock("../models/Notification.js", () => ({
  default: {
    create: async (payload) => {
      notificationsDb.push(payload);
      return payload;
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

const buildRes = () => {
  const res = {
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
  };
  return res;
};

const pendingApp = () => ({
  _id: "app-1",
  fullName: "Mentor Candidate",
  email: "mentor@example.com",
  currentRole: "Senior Engineer",
  expertise: ["Frontend", "Backend"],
  whyMentor: "I want to help.",
  status: APPLICATION_STATUS.PENDING_REVIEW,
  createdAt: new Date().toISOString(),
  yearsExperience: 5,
  rejectionHistory: [],
});

const mentorUser = () => ({
  _id: "user-1",
  role: "student",
  email: "mentor@example.com",
  isVerified: false,
  mentorStatus: MENTOR_STATUS.PENDING,
  status: USER_STATUS.PENDING,
});

describe("Mentor Queue System", () => {
  beforeEach(() => {
    applicationsDb.length = 0;
    usersDb.length = 0;
    notificationsDb.length = 0;
    adminActivityLogsDb.length = 0;
  });

  describe("Queue Separation", () => {
    it("approved applications disappear from pending queue", async () => {
      applicationsDb.push(pendingApp());
      usersDb.push(mentorUser());

      const res = buildRes();
      const next = vi.fn();
      await approveApplication(
        { params: { id: "app-1" }, body: {}, user: { _id: "admin-1" }, ip: "127.0.0.1", headers: { "user-agent": "test" } },
        res,
        next
      );

      expect(next).not.toHaveBeenCalled();

      const pendingRes = buildRes();
      await getQueueApplications("pending")(
        { query: {} },
        pendingRes,
        vi.fn()
      );

      expect(pendingRes.body.data.applications).toHaveLength(0);

      const approvedRes = buildRes();
      await getQueueApplications("approved")(
        { query: {} },
        approvedRes,
        vi.fn()
      );

      expect(approvedRes.body.data.applications).toHaveLength(1);
      expect(approvedRes.body.data.applications[0]._id).toBe("app-1");
    });

    it("rejected applications disappear from pending queue", async () => {
      applicationsDb.push(pendingApp());
      usersDb.push(mentorUser());

      const res = buildRes();
      const next = vi.fn();
      await rejectApplication(
        { params: { id: "app-1" }, body: { rejectionReason: "Not enough experience" }, user: { _id: "admin-1" }, ip: "127.0.0.1", headers: { "user-agent": "test" } },
        res,
        next
      );

      expect(next).not.toHaveBeenCalled();

      const pendingRes = buildRes();
      await getQueueApplications("pending")(
        { query: {} },
        pendingRes,
        vi.fn()
      );
      expect(pendingRes.body.data.applications).toHaveLength(0);

      const rejectedRes = buildRes();
      await getQueueApplications("rejected")(
        { query: {} },
        rejectedRes,
        vi.fn()
      );
      expect(rejectedRes.body.data.applications).toHaveLength(1);
      expect(rejectedRes.body.data.applications[0]._id).toBe("app-1");
    });

    it("changes-requested applications disappear from pending queue", async () => {
      applicationsDb.push(pendingApp());
      usersDb.push(mentorUser());

      const res = buildRes();
      const next = vi.fn();
      await requestChanges(
        { params: { id: "app-1" }, body: { reviewNotes: "Please add more expertise areas" }, user: { _id: "admin-1" }, ip: "127.0.0.1", headers: { "user-agent": "test" } },
        res,
        next
      );

      expect(next).not.toHaveBeenCalled();

      const pendingRes = buildRes();
      await getQueueApplications("pending")(
        { query: {} },
        pendingRes,
        vi.fn()
      );
      expect(pendingRes.body.data.applications).toHaveLength(0);

      const changesRes = buildRes();
      await getQueueApplications("changes-requested")(
        { query: {} },
        changesRes,
        vi.fn()
      );
      expect(changesRes.body.data.applications).toHaveLength(1);
      expect(changesRes.body.data.applications[0]._id).toBe("app-1");
    });

    it("no application appears in multiple queues simultaneously", async () => {
      applicationsDb.push(pendingApp());
      applicationsDb.push({ ...pendingApp(), _id: "app-2", email: "other@example.com" });

      const res = buildRes();
      await approveApplication(
        { params: { id: "app-1" }, body: {}, user: { _id: "admin-1" }, ip: "127.0.0.1", headers: { "user-agent": "test" } },
        res,
        vi.fn()
      );

      const pendingRes = buildRes();
      await getQueueApplications("pending")(
        { query: {} },
        pendingRes,
        vi.fn()
      );
      const pendingIds = pendingRes.body.data.applications.map((a) => a._id);

      const approvedRes = buildRes();
      await getQueueApplications("approved")(
        { query: {} },
        approvedRes,
        vi.fn()
      );
      const approvedIds = approvedRes.body.data.applications.map((a) => a._id);

      const allIds = [...pendingIds, ...approvedIds];
      const uniqueIds = new Set(allIds);
      expect(allIds.length).toBe(uniqueIds.size);
    });
  });

  describe("Statistics", () => {
    it("returns correct queue counts", async () => {
      applicationsDb.push(
        { ...pendingApp(), _id: "a1", status: APPLICATION_STATUS.PENDING_REVIEW },
        { ...pendingApp(), _id: "a2", email: "a2@test.com", status: APPLICATION_STATUS.APPROVED },
        { ...pendingApp(), _id: "a3", email: "a3@test.com", status: APPLICATION_STATUS.REJECTED },
        { ...pendingApp(), _id: "a4", email: "a4@test.com", status: APPLICATION_STATUS.CHANGES_REQUESTED },
        { ...pendingApp(), _id: "a5", email: "a5@test.com", status: APPLICATION_STATUS.ARCHIVED },
        { ...pendingApp(), _id: "a6", email: "a6@test.com", status: APPLICATION_STATUS.PENDING_REVIEW }
      );

      const res = buildRes();
      await getQueueStats({}, res, vi.fn());

      expect(res.statusCode).toBe(200);
      expect(res.body.data.stats).toEqual({
        pendingReview: 2,
        approved: 1,
        rejected: 1,
        changesRequested: 1,
        archived: 1,
      });
    });

    it("stats update immediately after actions", async () => {
      applicationsDb.push(pendingApp());
      usersDb.push(mentorUser());

      const res1 = buildRes();
      await getQueueStats({}, res1, vi.fn());
      expect(res1.body.data.stats.pendingReview).toBe(1);

      await rejectApplication(
        { params: { id: "app-1" }, body: { rejectionReason: "Not enough experience" }, user: { _id: "admin-1" }, ip: "127.0.0.1", headers: { "user-agent": "test" } },
        buildRes(),
        vi.fn()
      );

      const res2 = buildRes();
      await getQueueStats({}, res2, vi.fn());
      expect(res2.body.data.stats.pendingReview).toBe(0);
      expect(res2.body.data.stats.rejected).toBe(1);
    });
  });

  describe("Notifications", () => {
    it("creates notification on approval", async () => {
      applicationsDb.push(pendingApp());
      usersDb.push(mentorUser());
      usersDb.push({ _id: "admin-1", role: "admin", email: "admin@example.com" });

      await approveApplication(
        { params: { id: "app-1" }, body: {}, user: { _id: "admin-1" }, ip: "127.0.0.1", headers: { "user-agent": "test" } },
        buildRes(),
        vi.fn()
      );

      const mentorNotifications = notificationsDb.filter(
        (n) => n.recipient === "user-1" && n.type === "mentor_approved"
      );
      expect(mentorNotifications).toHaveLength(1);
    });

    it("creates notification on rejection", async () => {
      applicationsDb.push(pendingApp());
      usersDb.push(mentorUser());

      await rejectApplication(
        { params: { id: "app-1" }, body: { rejectionReason: "Not enough experience" }, user: { _id: "admin-1" }, ip: "127.0.0.1", headers: { "user-agent": "test" } },
        buildRes(),
        vi.fn()
      );

      const rejectNotifications = notificationsDb.filter(
        (n) => n.recipient === "user-1" && n.type === "mentor_rejected"
      );
      expect(rejectNotifications).toHaveLength(1);
      expect(rejectNotifications[0].message).toContain("Not enough experience");
    });

    it("creates notification on changes requested", async () => {
      applicationsDb.push(pendingApp());
      usersDb.push(mentorUser());

      await requestChanges(
        { params: { id: "app-1" }, body: { reviewNotes: "Please add more expertise areas" }, user: { _id: "admin-1" }, ip: "127.0.0.1", headers: { "user-agent": "test" } },
        buildRes(),
        vi.fn()
      );

      const changeNotifications = notificationsDb.filter(
        (n) => n.recipient === "user-1" && n.message.toLowerCase().includes("needs changes")
      );
      expect(changeNotifications).toHaveLength(1);
    });
  });

  describe("Audit Logs", () => {
    it("creates audit log on approve", async () => {
      applicationsDb.push(pendingApp());
      usersDb.push(mentorUser());

      await approveApplication(
        { params: { id: "app-1" }, body: {}, user: { _id: "admin-1" }, ip: "127.0.0.1", headers: { "user-agent": "test" } },
        buildRes(),
        vi.fn()
      );

      const logs = adminActivityLogsDb.filter((l) => l.action === "mentor_application.approved");
      expect(logs).toHaveLength(1);
      expect(logs[0].before.status).toBe(APPLICATION_STATUS.PENDING_REVIEW);
      expect(logs[0].after.status).toBe(APPLICATION_STATUS.APPROVED);
      expect(logs[0].actor).toBe("admin-1");
    });

    it("creates audit log on reject", async () => {
      applicationsDb.push(pendingApp());
      usersDb.push(mentorUser());

      await rejectApplication(
        { params: { id: "app-1" }, body: { rejectionReason: "Not enough experience" }, user: { _id: "admin-1" }, ip: "127.0.0.1", headers: { "user-agent": "test" } },
        buildRes(),
        vi.fn()
      );

      const logs = adminActivityLogsDb.filter((l) => l.action === "mentor_application.rejected");
      expect(logs).toHaveLength(1);
      expect(logs[0].before.status).toBe(APPLICATION_STATUS.PENDING_REVIEW);
      expect(logs[0].after.status).toBe(APPLICATION_STATUS.REJECTED);
      expect(logs[0].after.rejectionReason).toBe("Not enough experience");
    });

    it("creates audit log on request changes", async () => {
      applicationsDb.push(pendingApp());
      usersDb.push(mentorUser());

      await requestChanges(
        { params: { id: "app-1" }, body: { reviewNotes: "Please add more expertise areas" }, user: { _id: "admin-1" }, ip: "127.0.0.1", headers: { "user-agent": "test" } },
        buildRes(),
        vi.fn()
      );

      const logs = adminActivityLogsDb.filter((l) => l.action === "mentor_application.changes_requested");
      expect(logs).toHaveLength(1);
      expect(logs[0].before.status).toBe(APPLICATION_STATUS.PENDING_REVIEW);
      expect(logs[0].after.status).toBe(APPLICATION_STATUS.CHANGES_REQUESTED);
    });
  });

  describe("Rejection Validation", () => {
    it("requires rejection reason", async () => {
      applicationsDb.push(pendingApp());

      const res = buildRes();
      const next = vi.fn();
      await rejectApplication(
        { params: { id: "app-1" }, body: {}, user: { _id: "admin-1" }, ip: "127.0.0.1", headers: { "user-agent": "test" } },
        res,
        next
      );

      expect(next).toHaveBeenCalled();
      const error = next.mock.calls[0][0];
      expect(error.statusCode).toBe(400);
      expect(error.message).toContain("Rejection reason is required");
    });

    it("stores rejection reason in history", async () => {
      applicationsDb.push(pendingApp());
      usersDb.push(mentorUser());

      await rejectApplication(
        { params: { id: "app-1" }, body: { rejectionReason: "Not enough experience" }, user: { _id: "admin-1" }, ip: "127.0.0.1", headers: { "user-agent": "test" } },
        buildRes(),
        vi.fn()
      );

      const app = applicationsDb.find((a) => a._id === "app-1");
      expect(app.rejectionReason).toBe("Not enough experience");
      expect(app.rejectionHistory).toHaveLength(1);
      expect(app.rejectionHistory[0].reason).toBe("Not enough experience");
      expect(app.rejectionHistory[0].reviewedBy).toBe("admin-1");
    });
  });

  describe("Request Changes Validation", () => {
    it("requires review notes", async () => {
      applicationsDb.push(pendingApp());

      const res = buildRes();
      const next = vi.fn();
      await requestChanges(
        { params: { id: "app-1" }, body: {}, user: { _id: "admin-1" }, ip: "127.0.0.1", headers: { "user-agent": "test" } },
        res,
        next
      );

      expect(next).toHaveBeenCalled();
      const error = next.mock.calls[0][0];
      expect(error.statusCode).toBe(400);
      expect(error.message).toContain("Review notes are required");
    });
  });

  describe("State Validation", () => {
    it("rejects approving an already approved application", async () => {
      applicationsDb.push({ ...pendingApp(), status: APPLICATION_STATUS.APPROVED });

      const res = buildRes();
      const next = vi.fn();
      await approveApplication(
        { params: { id: "app-1" }, body: {}, user: { _id: "admin-1" }, ip: "127.0.0.1", headers: { "user-agent": "test" } },
        res,
        next
      );

      expect(next).toHaveBeenCalled();
      const error = next.mock.calls[0][0];
      expect(error.statusCode).toBe(400);
    });

    it("approves from changes_requested status", async () => {
      applicationsDb.push({ ...pendingApp(), status: APPLICATION_STATUS.CHANGES_REQUESTED });
      usersDb.push(mentorUser());

      const res = buildRes();
      const next = vi.fn();
      await approveApplication(
        { params: { id: "app-1" }, body: {}, user: { _id: "admin-1" }, ip: "127.0.0.1", headers: { "user-agent": "test" } },
        res,
        next
      );

      expect(next).not.toHaveBeenCalled();
      expect(res.statusCode).toBe(200);
    });

    it("returns 404 for non-existent application", async () => {
      const res = buildRes();
      const next = vi.fn();
      await approveApplication(
        { params: { id: "nonexistent" }, body: {}, user: { _id: "admin-1" }, ip: "127.0.0.1", headers: { "user-agent": "test" } },
        res,
        next
      );

      expect(next).toHaveBeenCalled();
      const error = next.mock.calls[0][0];
      expect(error.statusCode).toBe(404);
    });
  });

  describe("Filtering & Pagination", () => {
    it("returns paginated pending applications", async () => {
      for (let i = 0; i < 15; i++) {
        applicationsDb.push({
          ...pendingApp(),
          _id: `app-${i}`,
          email: `user${i}@test.com`,
        });
      }

      const res = buildRes();
      await getQueueApplications("pending")(
        { query: { page: "1", limit: "5" } },
        res,
        vi.fn()
      );

      expect(res.body.data.applications).toHaveLength(5);
      expect(res.body.data.pagination.total).toBe(15);
      expect(res.body.data.pagination.totalPages).toBe(3);
    });

    it("filters by search", async () => {
      applicationsDb.push(
        { ...pendingApp(), _id: "app-1", fullName: "Abebe Kebede" },
        { ...pendingApp(), _id: "app-2", email: "alemu@test.com", fullName: "Alemu Tadesse" },
        { ...pendingApp(), _id: "app-3", email: "betty@test.com", fullName: "Betty Wondimu" }
      );

      const res = buildRes();
      await getQueueApplications("pending")(
        { query: { search: "alemu" } },
        res,
        vi.fn()
      );

      expect(res.body.data.applications).toHaveLength(1);
      expect(res.body.data.applications[0]._id).toBe("app-2");
    });

    it("filters by expertise", async () => {
      applicationsDb.push(
        { ...pendingApp(), _id: "app-1", expertise: ["Frontend", "React"] },
        { ...pendingApp(), _id: "app-2", email: "ml@test.com", expertise: ["Machine Learning", "Python"] },
      );

      const res = buildRes();
      await getQueueApplications("pending")(
        { query: { expertise: "Machine Learning" } },
        res,
        vi.fn()
      );

      expect(res.body.data.applications).toHaveLength(1);
      expect(res.body.data.applications[0]._id).toBe("app-2");
    });

    it("filters by experience range", async () => {
      applicationsDb.push(
        { ...pendingApp(), _id: "app-1", yearsExperience: 2 },
        { ...pendingApp(), _id: "app-2", email: "mid@test.com", yearsExperience: 5 },
        { ...pendingApp(), _id: "app-3", email: "senior@test.com", yearsExperience: 10 },
      );

      const res = buildRes();
      await getQueueApplications("pending")(
        { query: { experienceMin: "4", experienceMax: "8" } },
        res,
        vi.fn()
      );

      expect(res.body.data.applications).toHaveLength(1);
      expect(res.body.data.applications[0]._id).toBe("app-2");
    });
  });

  describe("User Status Updates", () => {
    it("approve sets user as verified mentor with active status", async () => {
      applicationsDb.push(pendingApp());
      usersDb.push(mentorUser());

      await approveApplication(
        { params: { id: "app-1" }, body: {}, user: { _id: "admin-1" }, ip: "127.0.0.1", headers: { "user-agent": "test" } },
        buildRes(),
        vi.fn()
      );

      const user = usersDb.find((u) => u._id === "user-1");
      expect(user.isVerified).toBe(true);
      expect(user.mentorStatus).toBe(MENTOR_STATUS.APPROVED);
      expect(user.status).toBe(USER_STATUS.ACTIVE);
    });

    it("reject sets user as rejected", async () => {
      applicationsDb.push(pendingApp());
      usersDb.push(mentorUser());

      await rejectApplication(
        { params: { id: "app-1" }, body: { rejectionReason: "Not enough experience" }, user: { _id: "admin-1" }, ip: "127.0.0.1", headers: { "user-agent": "test" } },
        buildRes(),
        vi.fn()
      );

      const user = usersDb.find((u) => u._id === "user-1");
      expect(user.isVerified).toBe(false);
      expect(user.mentorStatus).toBe(MENTOR_STATUS.REJECTED);
      expect(user.status).toBe(USER_STATUS.REJECTED);
    });
  });
});
