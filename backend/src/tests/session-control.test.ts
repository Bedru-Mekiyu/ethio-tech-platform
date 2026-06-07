import { describe, it, expect, vi, beforeEach } from "vitest";

/* ------------------------------------------------------------------ */
/* Mock layer – isolate from real DB and external services             */
/* ------------------------------------------------------------------ */

const mockParticipant = vi.hoisted(() => ({
  _id: "p1",
  session: "session-1",
  user: "user-1",
  status: "joined",
  totalPresenceMs: 0,
  metadata: {},
  save: vi.fn().mockResolvedValue(true),
}));

vi.mock("../models/Session.js", () => ({
  default: {
    findById: vi.fn().mockResolvedValue({
      _id: "session-1",
      liveStartedAt: new Date(Date.now() - 120 * 60_000),
      liveEndedAt: null,
    }),
  },
}));

vi.mock("../models/SessionParticipant.js", () => ({
  default: {
    findOne: vi.fn().mockResolvedValue({ ...mockParticipant }),
    findOneAndUpdate: vi.fn().mockResolvedValue({ ...mockParticipant }),
    find: vi.fn().mockResolvedValue([{ ...mockParticipant }]),
    updateOne: vi.fn().mockReturnValue({ catch: vi.fn() }),
    bulkWrite: vi.fn().mockResolvedValue({}),
    create: vi.fn().mockResolvedValue({ ...mockParticipant }),
    countDocuments: vi.fn().mockResolvedValue(1),
  },
}));

vi.mock("../models/SessionAuditLog.js", () => ({
  default: { create: vi.fn().mockResolvedValue({}) },
}));

vi.mock("../models/ModerationLog.js", () => ({
  default: {
    create: vi.fn().mockResolvedValue({}),
    find: vi.fn().mockReturnValue({
      populate: vi.fn().mockReturnThis(),
      sort: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([]),
    }),
  },
}));

vi.mock("../models/ChatMessage.js", () => ({
  default: {
    findById: vi.fn().mockResolvedValue({
      _id: "msg-1",
      text: "test message",
      userId: "user-2",
      deleteOne: vi.fn().mockResolvedValue(true),
    }),
    countDocuments: vi.fn().mockResolvedValue(5),
  },
}));

vi.mock("../services/xpService.js", () => ({
  grantXPWithOptions: vi.fn().mockResolvedValue({ skipped: false }),
}));

/* ------------------------------------------------------------------ */
/* Import services under test AFTER mocks are declared                */
/* ------------------------------------------------------------------ */
import * as attendanceService from "../services/attendanceService.js";
import * as moderationService from "../services/moderationService.js";

/* ------------------------------------------------------------------ */
/* Attendance Service Tests                                            */
/* ------------------------------------------------------------------ */

describe("attendanceService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("recordJoin", () => {
    it("should upsert a SessionParticipant on join", async () => {
      const SessionParticipant = (await import("../models/SessionParticipant.js")).default;
      await attendanceService.recordJoin("session-1", "user-1", "127.0.0.1");
      expect(SessionParticipant.findOneAndUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ session: "session-1", user: "user-1" }),
        expect.any(Object),
        expect.objectContaining({ upsert: true, new: true }),
      );
    });

    it("should create an audit log entry on join", async () => {
      const SessionAuditLog = (await import("../models/SessionAuditLog.js")).default;
      await attendanceService.recordJoin("session-1", "new-user", "127.0.0.1");
      expect(SessionAuditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          session: "session-1",
          actor: "new-user",
        }),
      );
    });
  });

  describe("recordHeartbeat", () => {
    it("should buffer heartbeats without throwing", () => {
      expect(() => {
        attendanceService.recordHeartbeat("session-1", "user-1");
      }).not.toThrow();
    });

    it("should handle multiple rapid heartbeats without crashing", () => {
      for (let i = 0; i < 50; i++) {
        attendanceService.recordHeartbeat("session-1", `user-${i}`);
      }
      // No assertion beyond "didn't throw"
      expect(true).toBe(true);
    });
  });

  describe("recordLeave", () => {
    it("should mark participant as completed on leave", async () => {
      const SessionParticipant = (await import("../models/SessionParticipant.js")).default;
      await attendanceService.recordLeave("session-1", "user-1", "127.0.0.1");
      expect(SessionParticipant.findOneAndUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ session: "session-1", user: "user-1" }),
        expect.objectContaining({
          $set: expect.objectContaining({ status: "completed" }),
        }),
      );
    });

    it("should create an audit log for user_left", async () => {
      const SessionAuditLog = (await import("../models/SessionAuditLog.js")).default;
      await attendanceService.recordLeave("session-1", "user-1", "127.0.0.1");
      expect(SessionAuditLog.create).toHaveBeenCalledWith(expect.objectContaining({ action: "user_left" }));
    });
  });

  describe("verifyAttendance", () => {
    it("should return false if no session or participant found", async () => {
      const Session = (await import("../models/Session.js")).default;
      vi.mocked(Session.findById).mockResolvedValueOnce(null);
      const result = await attendanceService.verifyAttendance("session-x", "user-x");
      expect(result).toBe(false);
    });

    it("should verify attendance when threshold is met", async () => {
      const SessionParticipant = (await import("../models/SessionParticipant.js")).default;
      const Session = (await import("../models/Session.js")).default;

      const now = new Date();
      const startTime = new Date(now.getTime() - 60 * 60_000); // 1 hour ago
      vi.mocked(Session.findById).mockResolvedValueOnce({
        _id: "s1",
        liveStartedAt: startTime,
        liveEndedAt: now,
      });
      vi.mocked(SessionParticipant.findOne).mockResolvedValueOnce({
        totalPresenceMs: 45 * 60_000, // 45 minutes of a 60 minute session (>50%)
      });

      const result = await attendanceService.verifyAttendance("s1", "u1");
      expect(result).toBe(true);
    });
  });

  describe("batchVerifySession", () => {
    it("should use bulkWrite for batch verification", async () => {
      const SessionParticipant = (await import("../models/SessionParticipant.js")).default;
      const Session = (await import("../models/Session.js")).default;

      const now = new Date();
      vi.mocked(Session.findById).mockResolvedValueOnce({
        _id: "s1",
        liveStartedAt: new Date(now.getTime() - 90 * 60_000),
        liveEndedAt: now,
      });
      vi.mocked(SessionParticipant.find).mockResolvedValueOnce([
        { _id: "p1", user: "u1", totalPresenceMs: 60 * 60_000 },
        { _id: "p2", user: "u2", totalPresenceMs: 10 * 60_000 },
      ]);

      const results = await attendanceService.batchVerifySession("s1");
      expect(SessionParticipant.bulkWrite).toHaveBeenCalled();
      expect(results.length).toBe(2);
    });

    it("should return empty if session has no liveStartedAt", async () => {
      const Session = (await import("../models/Session.js")).default;
      vi.mocked(Session.findById).mockResolvedValueOnce({ _id: "s2", liveStartedAt: null });
      const results = await attendanceService.batchVerifySession("s2");
      expect(results).toEqual([]);
    });
  });
});

/* ------------------------------------------------------------------ */
/* Moderation Service Tests                                            */
/* ------------------------------------------------------------------ */

describe("moderationService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("checkSpam", () => {
    it("should detect spam with repeated keywords", () => {
      const spamText = "buy cheap buy cheap buy cheap click subscribe";
      const result = moderationService.checkSpam(spamText);
      expect(result).toBe(true);
    });

    it("should not flag normal messages as spam", () => {
      const normal = "Hello everyone, how is the session going?";
      const result = moderationService.checkSpam(normal);
      expect(result).toBe(false);
    });
  });

  describe("checkFlood", () => {
    it("should allow messages within the flood limit", () => {
      const uid = `flood-test-ok-${Date.now()}`;
      const result = moderationService.checkFlood(uid);
      expect(result).toBe(false);
    });

    it("should flag flooding after exceeding max messages", () => {
      const uid = `flood-test-over-${Date.now()}`;
      for (let i = 0; i < 6; i++) {
        moderationService.checkFlood(uid);
      }
      const result = moderationService.checkFlood(uid);
      expect(result).toBe(true);
    });
  });

  describe("muteUser", () => {
    it("should mute a participant and log the action", async () => {
      const SessionParticipant = (await import("../models/SessionParticipant.js")).default;
      const ModerationLog = (await import("../models/ModerationLog.js")).default;

      vi.mocked(SessionParticipant.findOne).mockResolvedValueOnce({
        metadata: {},
        save: vi.fn().mockResolvedValue(true),
      });

      const result = await moderationService.muteUser({
        sessionId: "s1",
        userId: "u1",
        actorId: "mentor1",
        durationMinutes: 10,
        reason: "disruption",
        ip: "127.0.0.1",
      });

      expect(result.muted).toBe(true);
      expect(result.expiresAt).toBeInstanceOf(Date);
      expect(ModerationLog.create).toHaveBeenCalledWith(expect.objectContaining({ action: "user_muted" }));
    });

    it("should throw if participant not found", async () => {
      const SessionParticipant = (await import("../models/SessionParticipant.js")).default;
      vi.mocked(SessionParticipant.findOne).mockResolvedValueOnce(null);

      await expect(
        moderationService.muteUser({
          sessionId: "s1",
          userId: "ghost",
          actorId: "mentor1",
          durationMinutes: 5,
          reason: "Test mute",
          ip: "127.0.0.1",
        }),
      ).rejects.toThrow("User not in session");
    });
  });

  describe("removeParticipant", () => {
    it("should set participant status to completed", async () => {
      const SessionParticipant = (await import("../models/SessionParticipant.js")).default;

      const result = await moderationService.removeParticipant({
        sessionId: "s1",
        userId: "u1",
        actorId: "mentor1",
        reason: "misconduct",
        ip: "127.0.0.1",
      });

      expect(result.removed).toBe(true);
      expect(SessionParticipant.findOneAndUpdate).toHaveBeenCalledWith(
        { session: "s1", user: "u1" },
        expect.objectContaining({ status: "completed" }),
      );
    });
  });

  describe("blockUser", () => {
    it("should block a user and set blockedAt metadata", async () => {
      const SessionParticipant = (await import("../models/SessionParticipant.js")).default;
      const ModerationLog = (await import("../models/ModerationLog.js")).default;

      vi.mocked(SessionParticipant.findOne).mockResolvedValueOnce({
        metadata: {},
        save: vi.fn().mockResolvedValue(true),
      });

      const result = await moderationService.blockUser({
        sessionId: "s1",
        userId: "u-bad",
        actorId: "mentor1",
        reason: "abuse",
        ip: "127.0.0.1",
      });

      expect(result.blocked).toBe(true);
      expect(ModerationLog.create).toHaveBeenCalledWith(expect.objectContaining({ action: "user_blocked" }));
    });
  });

  describe("deleteMessage", () => {
    it("should delete a message and log the action", async () => {
      const ModerationLog = (await import("../models/ModerationLog.js")).default;

      const result = await moderationService.deleteMessage({
        messageId: "msg-1",
        sessionId: "s1",
        actorId: "mentor1",
        reason: "inappropriate",
        ip: "127.0.0.1",
      });

      expect(result.deleted).toBe(true);
      expect(ModerationLog.create).toHaveBeenCalledWith(expect.objectContaining({ action: "message_deleted" }));
    });
  });

  describe("reportAbuse", () => {
    it("should create a moderation log for abuse report", async () => {
      const ModerationLog = (await import("../models/ModerationLog.js")).default;

      const result = await moderationService.reportAbuse({
        sessionId: "s1",
        userId: "reporter",
        reportedUserId: "u-offender",
        messageId: "msg-1",
        reason: "harassment",
        ip: "127.0.0.1",
      });

      expect(result.reported).toBe(true);
      expect(ModerationLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "abuse_reported",
          actor: "reporter",
          targetUser: "u-offender",
        }),
      );
    });
  });

  describe("timeoutUser", () => {
    it("should timeout a user with expiry", async () => {
      const SessionParticipant = (await import("../models/SessionParticipant.js")).default;

      vi.mocked(SessionParticipant.findOne).mockResolvedValueOnce({
        metadata: {},
        save: vi.fn().mockResolvedValue(true),
      });

      const result = await moderationService.timeoutUser({
        sessionId: "s1",
        userId: "u-disruptive",
        actorId: "mentor1",
        durationMinutes: 5,
        reason: "disruption",
        ip: "127.0.0.1",
      });

      expect(result.timedOut).toBe(true);
      expect(result.expiresAt).toBeInstanceOf(Date);
    });
  });
});
