import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

describe("Session Question Service", () => {
  it("should create a question", async () => {
    const { createQuestion } = await import("../services/sessionQuestionService.js");
    const question = await createQuestion({
      sessionId: new mongoose.Types.ObjectId(),
      userId: new mongoose.Types.ObjectId(),
      text: "What is TypeScript?",
    });
    expect(question.text).toBe("What is TypeScript?");
    expect(question.status).toBe("pending");
  });

  it("should upvote a question", async () => {
    const { createQuestion, upvoteQuestion } = await import("../services/sessionQuestionService.js");
    const userId = new mongoose.Types.ObjectId();
    const question = await createQuestion({
      sessionId: new mongoose.Types.ObjectId(),
      userId: new mongoose.Types.ObjectId(),
      text: "Test question",
    });
    const result = await upvoteQuestion({ questionId: String(question._id), userId });
    expect(result.upvoteCount).toBe(1);
    expect(result.upvoted).toBe(true);
  });

  it("should toggle upvote on second click", async () => {
    const { createQuestion, upvoteQuestion } = await import("../services/sessionQuestionService.js");
    const userId = new mongoose.Types.ObjectId();
    const question = await createQuestion({
      sessionId: new mongoose.Types.ObjectId(),
      userId: new mongoose.Types.ObjectId(),
      text: "Test question",
    });
    await upvoteQuestion({ questionId: String(question._id), userId });
    const result = await upvoteQuestion({ questionId: String(question._id), userId });
    expect(result.upvoteCount).toBe(0);
    expect(result.upvoted).toBe(false);
  });

  it("should answer a question", async () => {
    const { createQuestion, answerQuestion } = await import("../services/sessionQuestionService.js");
    const mentorId = new mongoose.Types.ObjectId();
    const question = await createQuestion({
      sessionId: new mongoose.Types.ObjectId(),
      userId: new mongoose.Types.ObjectId(),
      text: "What is Node.js?",
    });
    const answered = await answerQuestion({
      questionId: String(question._id),
      mentorId,
      text: "Node.js is a JavaScript runtime.",
    });
    expect(answered.status).toBe("answered");
    expect(answered.reply?.text).toBe("Node.js is a JavaScript runtime.");
    expect(String(answered.reply?.repliedBy)).toBe(String(mentorId));
  });

  it("should archive a question", async () => {
    const { createQuestion, archiveQuestion } = await import("../services/sessionQuestionService.js");
    const question = await createQuestion({
      sessionId: new mongoose.Types.ObjectId(),
      userId: new mongoose.Types.ObjectId(),
      text: "Archivable question",
    });
    const archived = await archiveQuestion({ questionId: String(question._id) });
    expect(archived.status).toBe("archived");
  });
});

describe("Session Poll Service", () => {
  it("should create a single choice poll", async () => {
    const { createPoll } = await import("../services/sessionPollService.js");
    const poll = await createPoll({
      sessionId: new mongoose.Types.ObjectId(),
      userId: new mongoose.Types.ObjectId(),
      question: "Best programming language?",
      type: "single",
      options: ["JavaScript", "Python", "TypeScript"],
    });
    expect(poll.options).toHaveLength(3);
    expect(poll.type).toBe("single");
    expect(poll.status).toBe("active");
  });

  it("should create a true/false poll", async () => {
    const { createPoll } = await import("../services/sessionPollService.js");
    const poll = await createPoll({
      sessionId: new mongoose.Types.ObjectId(),
      userId: new mongoose.Types.ObjectId(),
      question: "Is TypeScript better than JavaScript?",
      type: "true_false",
      options: [],
    });
    expect(poll.options).toHaveLength(2);
    expect(poll.options[0].text).toBe("True");
    expect(poll.options[1].text).toBe("False");
  });

  it("should record a vote", async () => {
    const { createPoll, votePoll } = await import("../services/sessionPollService.js");
    const userId = new mongoose.Types.ObjectId();
    const poll = await createPoll({
      sessionId: new mongoose.Types.ObjectId(),
      userId: new mongoose.Types.ObjectId(),
      question: "Favorite color?",
      type: "single",
      options: ["Red", "Blue", "Green"],
    });
    const result = await votePoll({ pollId: String(poll._id), userId, optionIndexes: [0] });
    expect(result.voted).toBe(true);
    expect(result.poll.options[0].voteCount).toBe(1);
  });

  it("should close a poll", async () => {
    const { createPoll, closePoll } = await import("../services/sessionPollService.js");
    const poll = await createPoll({
      sessionId: new mongoose.Types.ObjectId(),
      userId: new mongoose.Types.ObjectId(),
      question: "Test?",
      type: "true_false",
      options: [],
    });
    const closed = await closePoll(String(poll._id));
    expect(closed.status).toBe("closed");
  });

  it("should reopen a poll", async () => {
    const { createPoll, closePoll, reopenPoll } = await import("../services/sessionPollService.js");
    const poll = await createPoll({
      sessionId: new mongoose.Types.ObjectId(),
      userId: new mongoose.Types.ObjectId(),
      question: "Test?",
      type: "true_false",
      options: [],
    });
    await closePoll(String(poll._id));
    const reopened = await reopenPoll(String(poll._id));
    expect(reopened.status).toBe("active");
  });
});

describe("Hand Raise Service", () => {
  it("should raise a hand", async () => {
    const { raiseHand } = await import("../services/handRaiseService.js");
    const result = await raiseHand({
      sessionId: new mongoose.Types.ObjectId(),
      userId: new mongoose.Types.ObjectId(),
    });
    expect(result.status).toBe("raised");
    expect(result.queuePosition).toBe(1);
  });

  it("should preserve queue order", async () => {
    const { raiseHand } = await import("../services/handRaiseService.js");
    const sessionId = new mongoose.Types.ObjectId();
    const r1 = await raiseHand({ sessionId, userId: new mongoose.Types.ObjectId() });
    const r2 = await raiseHand({ sessionId, userId: new mongoose.Types.ObjectId() });
    expect(r1.queuePosition).toBe(1);
    expect(r2.queuePosition).toBe(2);
  });

  it("should lower a hand", async () => {
    const { raiseHand, lowerHand } = await import("../services/handRaiseService.js");
    const sessionId = new mongoose.Types.ObjectId();
    const userId = new mongoose.Types.ObjectId();
    await raiseHand({ sessionId, userId });
    const result = await lowerHand({ sessionId, userId });
    expect(result?.status).toBe("lowered");
  });
});

describe("Engagement Service", () => {
  it("should calculate engagement score", async () => {
    const { calculateEngagementScore } = await import("../services/engagementService.js");
    const sessionId = new mongoose.Types.ObjectId();
    const userId = new mongoose.Types.ObjectId();
    const SessionParticipant = (await import("../models/SessionParticipant.js")).default;
    await SessionParticipant.create({
      session: sessionId,
      user: userId,
      totalPresenceMs: 1800000,
      status: "active",
    });
    const result = await calculateEngagementScore({ sessionId, userId });
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.details).toBeDefined();
  });
});

describe("Moderation Service", () => {
  it("should detect spam", async () => {
    const { checkSpam } = await import("../services/moderationService.js");
    expect(checkSpam("buy cheap clicks free money now!!!")).toBe(true);
    expect(checkSpam("What is the definition of recursion?")).toBe(false);
  });

  it("should detect flood", async () => {
    const { checkFlood } = await import("../services/moderationService.js");
    const userId = "test-flood-user";
    for (let i = 0; i < 3; i++) checkFlood(userId);
    expect(checkFlood(userId)).toBe(false);
  });

  it("should delete a message", async () => {
    const { deleteMessage } = await import("../services/moderationService.js");
    const ChatMessage = (await import("../models/ChatMessage.js")).default;
    const msg = await ChatMessage.create({
      roomId: "session-test",
      userId: new mongoose.Types.ObjectId(),
      text: "Bad message",
      messageId: "test-msg-1",
    });
    const result = await deleteMessage({
      messageId: String(msg._id),
      sessionId: new mongoose.Types.ObjectId(),
      actorId: new mongoose.Types.ObjectId(),
      reason: "Inappropriate content",
      ip: "127.0.0.1",
    });
    expect(result.deleted).toBe(true);
    const found = await ChatMessage.findById(msg._id);
    expect(found).toBeNull();
  });
});

describe("Mentor Workflow Integration", () => {
  it("should handle full Q&A workflow: create -> upvote -> answer -> archive", async () => {
    const { createQuestion, upvoteQuestion, answerQuestion, archiveQuestion } =
      await import("../services/sessionQuestionService.js");
    const sessionId = new mongoose.Types.ObjectId();
    const studentId = new mongoose.Types.ObjectId();
    const mentorId = new mongoose.Types.ObjectId();

    const question = await createQuestion({ sessionId, userId: studentId, text: "What is an API?" });
    expect(question.status).toBe("pending");

    await upvoteQuestion({ questionId: String(question._id), userId: new mongoose.Types.ObjectId() });
    const upvoted = await upvoteQuestion({ questionId: String(question._id), userId: new mongoose.Types.ObjectId() });
    expect(upvoted.upvoteCount).toBe(2);

    const answered = await answerQuestion({
      questionId: String(question._id),
      mentorId,
      text: "API stands for Application Programming Interface.",
    });
    expect(answered.status).toBe("answered");

    const archived = await archiveQuestion({ questionId: String(question._id) });
    expect(archived.status).toBe("archived");
  });

  it("should handle full poll workflow: create -> vote -> close -> publish", async () => {
    const { createPoll, votePoll, closePoll, publishResults } =
      await import("../services/sessionPollService.js");
    const sessionId = new mongoose.Types.ObjectId();
    const userId1 = new mongoose.Types.ObjectId();
    const userId2 = new mongoose.Types.ObjectId();

    const poll = await createPoll({
      sessionId,
      userId: new mongoose.Types.ObjectId(),
      question: "Test?",
      type: "single",
      options: ["A", "B", "C"],
    });

    await votePoll({ pollId: String(poll._id), userId: userId1, optionIndexes: [0] });
    await votePoll({ pollId: String(poll._id), userId: userId2, optionIndexes: [1] });

    const closed = await closePoll(String(poll._id));
    expect(closed.status).toBe("closed");

    const published = await publishResults(String(poll._id));
    expect(published.status).toBe("results_published");
  });

  it("should handle full hand raise workflow: raise -> call on -> mark answered", async () => {
    const { raiseHand, callOnStudent, markAnswered } =
      await import("../services/handRaiseService.js");
    const sessionId = new mongoose.Types.ObjectId();
    const userId = new mongoose.Types.ObjectId();

    await raiseHand({ sessionId, userId });

    const called = await callOnStudent({ sessionId, userId });
    expect(called.status).toBe("called_on");

    const answered = await markAnswered({ sessionId, userId });
    expect(answered?.status).toBe("answered");
  });
});
