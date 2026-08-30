import { describe, it, expect, vi, beforeEach } from "vitest";

const mockFindOne = vi.fn();

vi.mock("../../models/SessionParticipant.js", () => ({
  default: {
    findOne: (...args) => mockFindOne(...args),
  },
}));

import { canUserAccessMeeting } from "../../services/meetingService.js";

describe("canUserAccessMeeting", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFindOne.mockReturnValue({
      select: vi.fn().mockResolvedValue(null),
    });
  });

  const mentor = { _id: "m1", role: "mentor" };
  const student = { _id: "st1", role: "student" };
  const otherStudent = { _id: "st2", role: "student" };
  const admin = { _id: "adm1", role: "admin" };
  const superAdmin = { _id: "sadm1", role: "super_admin" };

  const session = {
    _id: "s1",
    mentor: "m1",
    participants: ["st1"],
    status: "scheduled",
  };

  it("grants mentor access to their own meeting", async () => {
    expect(await canUserAccessMeeting(mentor, session)).toBe(true);
  });

  it("grants student access when they are in session participants array", async () => {
    expect(await canUserAccessMeeting(student, session)).toBe(true);
  });

  it("denies a different student who has no participant record", async () => {
    mockFindOne.mockReturnValue({
      select: vi.fn().mockResolvedValue(null),
    });
    expect(await canUserAccessMeeting(otherStudent, session)).toBe(false);
  });

  it("grants admin access to any meeting", async () => {
    expect(await canUserAccessMeeting(admin, session)).toBe(true);
  });

  it("grants super_admin access to any meeting", async () => {
    expect(await canUserAccessMeeting(superAdmin, session)).toBe(true);
  });

  it("grants access when user has a SessionParticipant record", async () => {
    mockFindOne.mockReturnValue({
      select: vi.fn().mockResolvedValue({ session: "s1", user: "st2", status: "joined" }),
    });
    expect(await canUserAccessMeeting(otherStudent, session)).toBe(true);
  });

  it("denies access when user is null", async () => {
    expect(await canUserAccessMeeting(null, session)).toBe(false);
  });

  it("denies access when session is null", async () => {
    expect(await canUserAccessMeeting(student, null)).toBe(false);
  });
});
