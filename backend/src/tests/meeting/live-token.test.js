import { describe, it, expect, vi, beforeEach } from "vitest";
import jwt from "jsonwebtoken";

const TEST_SECRET = "this-is-a-32-char-test-secret!!";

vi.mock("../../config/env.js", () => ({
  getEnv: () => ({
    liveClassroomSecret: TEST_SECRET,
    jwtSecret: "jwt-test-secret-here-32chars",
  }),
}));

const mockFindById = vi.fn();
const mockFindOne = vi.fn();

const selectable = (value) => ({
  ...(value || {}),
  select: vi.fn().mockReturnThis(),
  lean: vi.fn().mockReturnThis(),
});

vi.mock("../../models/Session.js", () => ({
  default: { findById: (...args) => mockFindById(...args) || selectable({}) },
}));

vi.mock("../../models/SessionParticipant.js", () => ({
  default: { findOne: (...args) => mockFindOne(...args) || selectable({}) },
}));

describe("Live Access Token Validation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects missing token", async () => {
    const { validateLiveAccessToken } = await import("../../services/liveClassroomService.js");
    const result = await validateLiveAccessToken(null, "user1");
    expect(result.valid).toBe(false);
    expect(result.reason).toContain("No token");
  });

  it("rejects expired token", async () => {
    const { validateLiveAccessToken } = await import("../../services/liveClassroomService.js");
    const token = jwt.sign(
      { type: "live-classroom", sessionId: "s1", userId: "user1", roomId: "r1" },
      TEST_SECRET,
      { expiresIn: "0s" }
    );
    await new Promise((r) => setTimeout(r, 1100));
    const result = await validateLiveAccessToken(token, "user1");
    expect(result.valid).toBe(false);
    expect(result.reason).toContain("expired");
  });

  it("rejects wrong type token", async () => {
    const { validateLiveAccessToken } = await import("../../services/liveClassroomService.js");
    const token = jwt.sign(
      { type: "not-classroom", sessionId: "s1", userId: "user1", roomId: "r1" },
      TEST_SECRET
    );
    const result = await validateLiveAccessToken(token, "user1");
    expect(result.valid).toBe(false);
    expect(result.reason).toContain("live classroom");
  });

  it("rejects token with wrong secret", async () => {
    const { validateLiveAccessToken } = await import("../../services/liveClassroomService.js");
    const token = jwt.sign(
      { type: "live-classroom", sessionId: "s1", userId: "user1", roomId: "r1" },
      "wrong-secret-here-not-matching-32chars"
    );
    const result = await validateLiveAccessToken(token, "user1");
    expect(result.valid).toBe(false);
  });

  it("rejects token for different user", async () => {
    const { validateLiveAccessToken } = await import("../../services/liveClassroomService.js");
    const token = jwt.sign(
      { type: "live-classroom", sessionId: "s1", userId: "user1", roomId: "r1" },
      TEST_SECRET
    );
    const result = await validateLiveAccessToken(token, "user2");
    expect(result.valid).toBe(false);
    expect(result.reason).toContain("user mismatch");
  });

  it("rejects token for ended session", async () => {
    const { validateLiveAccessToken } = await import("../../services/liveClassroomService.js");
    mockFindById.mockResolvedValue({ _id: "s1", status: "ended" });

    const token = jwt.sign(
      { type: "live-classroom", sessionId: "s1", userId: "user1", roomId: "r1" },
      TEST_SECRET
    );
    const result = await validateLiveAccessToken(token, "user1");
    expect(result.valid).toBe(false);
    expect(result.reason).toContain("no longer active");
  });

  it("rejects token for denied admission", async () => {
    const { validateLiveAccessToken } = await import("../../services/liveClassroomService.js");
    mockFindById.mockResolvedValue({ _id: "s1", status: "live", admissionMode: "waiting-room" });
    mockFindOne.mockResolvedValue({ admissionStatus: "denied" });

    const token = jwt.sign(
      { type: "live-classroom", sessionId: "s1", userId: "user1", roomId: "r1" },
      TEST_SECRET
    );
    const result = await validateLiveAccessToken(token, "user1");
    expect(result.valid).toBe(false);
    expect(result.reason).toContain("denied");
  });

  it("valid token returns valid with role", async () => {
    const { validateLiveAccessToken } = await import("../../services/liveClassroomService.js");
    mockFindById.mockResolvedValue({ _id: "s1", status: "live", admissionMode: "open" });
    mockFindOne.mockResolvedValue({ role: "participant", admissionStatus: "admitted" });

    const token = jwt.sign(
      { type: "live-classroom", sessionId: "s1", userId: "user1", roomId: "r1" },
      TEST_SECRET
    );
    const result = await validateLiveAccessToken(token, "user1");
    expect(result.valid).toBe(true);
    expect(result.role).toBe("participant");
  });
});
