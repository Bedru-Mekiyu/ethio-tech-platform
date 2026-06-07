import { describe, it, expect, vi, beforeEach } from "vitest";

/* ------------------------------------------------------------------ */
/* Mock layer                                                          */
/* ------------------------------------------------------------------ */

vi.mock("../models/EngagementScore.js", () => ({
  default: {
    findOneAndUpdate: vi.fn().mockResolvedValue({
      session: "s1",
      student: "u1",
      score: 72,
    }),
    findOne: vi.fn().mockResolvedValue({
      session: "s1",
      student: "u1",
      score: 72,
      questionsAsked: 3,
      pollParticipations: 2,
      chatMessages: 8,
      handsRaised: 1,
      resourcesViewed: 2,
      attendanceMs: 1_800_000,
    }),
    find: vi.fn().mockReturnValue({
      populate: vi.fn().mockReturnThis(),
      sort: vi.fn().mockResolvedValue([
        { student: { _id: "u1", fullName: "Abebe" }, score: 85 },
        { student: { _id: "u2", fullName: "Kebede" }, score: 62 },
      ]),
    }),
    aggregate: vi.fn().mockResolvedValue([
      {
        avgScore: 73.5,
        maxScore: 85,
        minScore: 62,
        totalStudents: 2,
        avgQuestions: 2.5,
        avgPolls: 1.5,
        avgChat: 6,
      },
    ]),
  },
}));

vi.mock("../models/SessionParticipant.js", () => ({
  default: {
    findOne: vi.fn().mockResolvedValue({
      session: "s1",
      user: "u1",
      totalPresenceMs: 1_800_000,
    }),
  },
}));

vi.mock("../models/SessionQuestion.js", () => ({
  default: { countDocuments: vi.fn().mockResolvedValue(3) },
}));

vi.mock("../models/SessionPoll.js", () => ({
  default: { countDocuments: vi.fn().mockResolvedValue(2) },
}));

vi.mock("../models/ChatMessage.js", () => ({
  default: { countDocuments: vi.fn().mockResolvedValue(8) },
}));

vi.mock("../models/HandRaise.js", () => ({
  default: { countDocuments: vi.fn().mockResolvedValue(1) },
}));

vi.mock("../models/SessionResource.js", () => ({
  default: { countDocuments: vi.fn().mockResolvedValue(2) },
}));

/* ------------------------------------------------------------------ */
/* Import service under test                                           */
/* ------------------------------------------------------------------ */
import * as engagementService from "../services/engagementService.js";

describe("engagementService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("calculateEngagementScore", () => {
    it("should calculate a composite engagement score", async () => {
      const result = await engagementService.calculateEngagementScore({
        sessionId: "s1",
        userId: "u1",
      });

      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
      expect(result.details).toMatchObject({
        questionsAsked: 3,
        pollParticipations: 2,
        chatMessages: 8,
        handsRaised: 1,
        resourcesViewed: 2,
      });
    });

    it("should return 0 if participant not found", async () => {
      const SessionParticipant = (await import("../models/SessionParticipant.js")).default;
      vi.mocked(SessionParticipant.findOne).mockResolvedValueOnce(null);

      const result = await engagementService.calculateEngagementScore({
        sessionId: "s-none",
        userId: "u-none",
      });

      expect(result.score).toBe(0);
      expect(result.details).toEqual({});
    });

    it("should cap the score at 100", async () => {
      const SessionQuestion = (await import("../models/SessionQuestion.js")).default;
      const ChatMessage = (await import("../models/ChatMessage.js")).default;
      const HandRaise = (await import("../models/HandRaise.js")).default;

      // Give massive activity counts to exceed 100
      vi.mocked(SessionQuestion.countDocuments).mockResolvedValueOnce(20);
      vi.mocked(ChatMessage.countDocuments).mockResolvedValueOnce(50);
      vi.mocked(HandRaise.countDocuments).mockResolvedValueOnce(10);

      const result = await engagementService.calculateEngagementScore({
        sessionId: "s1",
        userId: "u-active",
      });

      expect(result.score).toBeLessThanOrEqual(100);
    });

    it("should upsert to EngagementScore model", async () => {
      const EngagementScore = (await import("../models/EngagementScore.js")).default;

      await engagementService.calculateEngagementScore({
        sessionId: "s1",
        userId: "u1",
      });

      expect(EngagementScore.findOneAndUpdate).toHaveBeenCalledWith(
        { session: "s1", student: "u1" },
        expect.objectContaining({
          score: expect.any(Number),
          questionsAsked: expect.any(Number),
          lastCalculatedAt: expect.any(Date),
        }),
        { upsert: true, new: true },
      );
    });
  });

  describe("getSessionEngagementScores", () => {
    it("should return sorted engagement scores for a session", async () => {
      const scores = await engagementService.getSessionEngagementScores("s1");
      expect(scores).toHaveLength(2);
      expect(scores[0].score).toBeGreaterThanOrEqual(scores[1].score);
    });
  });

  describe("getSessionEngagementSummary", () => {
    it("should return aggregate engagement stats", async () => {
      const summary = await engagementService.getSessionEngagementSummary("s1");
      expect(summary).toMatchObject({
        avgScore: expect.any(Number),
        maxScore: expect.any(Number),
        minScore: expect.any(Number),
        totalStudents: expect.any(Number),
      });
    });

    it("should return zeros if no data is available", async () => {
      const EngagementScore = (await import("../models/EngagementScore.js")).default;
      vi.mocked(EngagementScore.aggregate).mockResolvedValueOnce([]);

      const summary = await engagementService.getSessionEngagementSummary("s-empty");
      expect(summary.avgScore).toBe(0);
      expect(summary.totalStudents).toBe(0);
    });
  });

  describe("getStudentEngagement", () => {
    it("should return existing engagement if present", async () => {
      const result = await engagementService.getStudentEngagement({
        sessionId: "s1",
        userId: "u1",
      });

      expect(result.engagement).toBeDefined();
      expect(result.engagement?.score).toBe(72);
    });

    it("should calculate engagement if not found and return result", async () => {
      const EngagementScore = (await import("../models/EngagementScore.js")).default;
      vi.mocked(EngagementScore.findOne)
        .mockResolvedValueOnce(null) // first call: not found
        .mockResolvedValueOnce({
          // second call after calculation
          session: "s1",
          student: "u-new",
          score: 45,
        });

      const result = await engagementService.getStudentEngagement({
        sessionId: "s1",
        userId: "u-new",
      });

      expect(result.calculated).toBeDefined();
    });
  });
});
