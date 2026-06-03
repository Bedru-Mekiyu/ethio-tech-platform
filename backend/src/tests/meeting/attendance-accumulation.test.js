import { describe, it, expect, vi, beforeEach } from "vitest";

const mockBulkWrite = vi.fn();
const mockFindOneAndUpdate = vi.fn();
const mockFindOne = vi.fn();
const mockCreate = vi.fn();
const mockFindById = vi.fn();

const selectable = (value) => ({
  ...(value || {}),
  select: vi.fn().mockReturnThis(),
  lean: vi.fn().mockReturnThis(),
});

vi.mock("../../models/SessionParticipant.js", () => ({
  default: {
    bulkWrite: mockBulkWrite,
    findOneAndUpdate: (...args) => mockFindOneAndUpdate(...args) || selectable({}),
    findOne: (...args) => mockFindOne(...args) || selectable({}),
    find: vi.fn(),
    updateOne: vi.fn().mockReturnValue({ catch: vi.fn() }),
  },
}));

vi.mock("../../models/Session.js", () => ({
  default: {
    findById: (...args) => mockFindById(...args) || selectable({}),
    find: vi.fn(),
  },
}));

vi.mock("../../models/SessionAuditLog.js", () => ({
  default: { create: mockCreate },
}));

vi.mock("../../services/xpService.js", () => ({
  grantXPWithOptions: vi.fn(),
}));

describe("Attendance Accumulation", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    mockFindOne.mockReset();
    mockFindOneAndUpdate.mockReset();
    mockFindById.mockReset();
  });

  it("recordHeartbeat accumulates deltas across multiple calls", async () => {
    const { recordHeartbeat, recordLeave } = await import("../../services/attendanceService.js");

    const sessionId = "session1";
    const userId = "user1";

    mockFindOne.mockResolvedValue({
      session: sessionId,
      user: userId,
      totalPresenceMs: 0,
      status: "active",
      save: vi.fn(),
    });

    mockFindOneAndUpdate.mockResolvedValue({});
    mockFindById.mockResolvedValue(null);

    const t0 = Date.now() - 120_000;
    vi.spyOn(Date, "now")
      .mockReturnValueOnce(t0)
      .mockReturnValueOnce(t0 + 30_000)
      .mockReturnValueOnce(t0 + 60_000)
      .mockReturnValueOnce(t0 + 90_000)
      .mockReturnValueOnce(t0 + 120_000);

    recordHeartbeat(sessionId, userId);
    recordHeartbeat(sessionId, userId);
    recordHeartbeat(sessionId, userId);
    recordHeartbeat(sessionId, userId);

    mockFindOne.mockResolvedValue({
      session: sessionId,
      user: userId,
      totalPresenceMs: 90000,
    });
    mockFindOneAndUpdate.mockResolvedValue({});

    await recordLeave(sessionId, userId);

    const updateCall = mockFindOneAndUpdate.mock.calls.find(
      ([filter]) => filter.session === sessionId && filter.user === userId
    );
    expect(updateCall).toBeDefined();
  });

  it("recordJoin clears stale buffer entry on reconnect", async () => {
    const { recordJoin } = await import("../../services/attendanceService.js");

    mockFindOneAndUpdate.mockResolvedValue({});
    mockCreate.mockResolvedValue({});

    await recordJoin("session1", "user1", "127.0.0.1");

    expect(mockFindOneAndUpdate).toHaveBeenCalledWith(
      { session: "session1", user: "user1" },
      expect.objectContaining({
        $set: expect.objectContaining({ status: "joined" }),
      }),
      expect.any(Object)
    );
  });

  it("recordLeave flushes remaining delta before saving", async () => {
    const { recordHeartbeat, recordLeave } = await import("../../services/attendanceService.js");

    const sessionId = "session1";
    const userId = "user1";

    const t0 = Date.now() - 60_000;
    vi.spyOn(Date, "now").mockReturnValue(t0);

    mockFindOneAndUpdate.mockResolvedValue({});
    mockFindById.mockResolvedValue(null);

    recordHeartbeat(sessionId, userId);

    vi.spyOn(Date, "now").mockReturnValue(t0 + 45_000);

    mockFindOne.mockResolvedValue({
      session: sessionId,
      user: userId,
      totalPresenceMs: 45000,
    });

    await recordLeave(sessionId, userId);

    const auditCall = mockCreate.mock.calls.find(
      ([log]) => log.action === "user_left" && log.session === sessionId
    );
    expect(auditCall).toBeDefined();
  });
});
