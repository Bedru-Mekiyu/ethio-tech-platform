import { describe, expect, it } from "vitest";
import {
  computeMeetingStatus,
  enrichMeeting,
  formatCountdown,
  formatDate,
  formatDateTime,
  formatTime,
} from "./meetingStatus";
import type { MeetingViewModel } from "@/lib/realtime";

const NOW = new Date("2026-06-06T12:00:00Z").getTime();

const baseMeeting: MeetingViewModel = {
  id: "s1",
  sessionId: "s1",
  title: "Algebra deep-dive",
  mentorId: "m1",
  mentorName: "Mentor One",
  mentorAvatar: null,
  studentId: null,
  studentName: "",
  scheduledAt: "2026-06-06T12:00:00Z",
  durationMinutes: 60,
  status: "scheduled",
  hostJoined: false,
  presenceCount: 0,
  startsInMs: null,
  endsAt: null,
  liveRoomId: null,
  classroomMode: "immersive-3d",
  liveProvider: "jitsi",
  joinable: false,
  isHost: false,
  isAdmin: false,
  isParticipant: true,
  joinHref: "/app/classroom/s1",
};

describe("computeMeetingStatus", () => {
  it("returns scheduled when current time is before scheduledAt", () => {
    const result = computeMeetingStatus(
      { _id: "s1", status: "scheduled", scheduledAt: "2026-06-06T12:00:00Z", durationMinutes: 60 },
      NOW - 60_000,
    );
    expect(result).toBe("scheduled");
  });

  it("returns waiting_for_host when current time is at/after scheduledAt but host has not joined", () => {
    const result = computeMeetingStatus(
      { _id: "s1", status: "scheduled", scheduledAt: "2026-06-06T12:00:00Z", durationMinutes: 60 },
      NOW + 30_000,
    );
    expect(result).toBe("waiting_for_host");
  });

  it("returns active when host has joined within window", () => {
    const result = computeMeetingStatus(
      {
        _id: "s1",
        status: "scheduled",
        scheduledAt: "2026-06-06T12:00:00Z",
        durationMinutes: 60,
        hostJoined: true,
      },
      NOW + 5 * 60_000,
    );
    expect(result).toBe("active");
  });

  it("returns completed when duration window has elapsed and host never joined", () => {
    const result = computeMeetingStatus(
      { _id: "s1", status: "scheduled", scheduledAt: "2026-06-06T12:00:00Z", durationMinutes: 60 },
      NOW + 61 * 60_000,
    );
    expect(result).toBe("completed");
  });

  it("returns cancelled when status is canceled", () => {
    expect(computeMeetingStatus({ _id: "s1", status: "canceled", scheduledAt: "2026-06-06T12:00:00Z" }, NOW)).toBe(
      "cancelled",
    );
  });

  it("returns completed when status is ended regardless of time", () => {
    expect(computeMeetingStatus({ _id: "s1", status: "ended", scheduledAt: "2099-01-01T00:00:00Z" }, NOW)).toBe(
      "completed",
    );
  });

  it("returns active when status is live or paused", () => {
    expect(computeMeetingStatus({ _id: "s1", status: "live", scheduledAt: "2026-06-06T12:00:00Z" }, NOW)).toBe(
      "active",
    );
    expect(computeMeetingStatus({ _id: "s1", status: "paused", scheduledAt: "2026-06-06T12:00:00Z" }, NOW)).toBe(
      "active",
    );
  });

  it("returns active for registration_closed with host joined", () => {
    expect(
      computeMeetingStatus(
        {
          _id: "s1",
          status: "registration_closed",
          scheduledAt: "2026-06-06T12:00:00Z",
          hostJoined: true,
        },
        NOW,
      ),
    ).toBe("active");
  });
});

describe("enrichMeeting", () => {
  it("computes startsInMs relative to now", () => {
    const enriched = enrichMeeting(baseMeeting, NOW);
    expect(enriched.startsInMs).toBe(0);
  });

  it("computes endsAt from scheduledAt + duration when live times absent", () => {
    const enriched = enrichMeeting(baseMeeting, NOW);
    expect(enriched.endsAt).toBe("2026-06-06T13:00:00.000Z");
  });

  it("preserves explicit endsAt from server", () => {
    const enriched = enrichMeeting({ ...baseMeeting, endsAt: "2030-01-01T00:00:00.000Z" }, NOW);
    expect(enriched.endsAt).toBe("2030-01-01T00:00:00.000Z");
  });

  it("uses liveStartedAt to compute endsAt when present", () => {
    const enriched = enrichMeeting({ ...baseMeeting, liveStartedAt: "2026-06-06T12:30:00Z" }, NOW);
    expect(enriched.endsAt).toBe("2026-06-06T13:30:00.000Z");
  });

  it("uses liveEndedAt to compute endsAt when present", () => {
    const enriched = enrichMeeting(
      { ...baseMeeting, liveStartedAt: "2026-06-06T12:30:00Z", liveEndedAt: "2026-06-06T12:45:00Z" },
      NOW,
    );
    expect(enriched.endsAt).toBe("2026-06-06T12:45:00.000Z");
  });
});

describe("formatters", () => {
  it("formatCountdown handles null/undefined and zero", () => {
    expect(formatCountdown(null)).toBe("");
    expect(formatCountdown(undefined)).toBe("");
    expect(formatCountdown(0)).toBe("starting now");
    expect(formatCountdown(-1000)).toBe("starting now");
  });

  it("formatCountdown formats days/hours/minutes/seconds", () => {
    expect(formatCountdown(2 * 86_400_000 + 3 * 3_600_000)).toBe("2d 3h");
    expect(formatCountdown(4 * 3_600_000 + 15 * 60_000)).toBe("4h 15m");
    expect(formatCountdown(7 * 60_000)).toBe("7 min");
    expect(formatCountdown(45_000)).toBe("45s");
    expect(formatCountdown(500)).toBe("1s");
  });

  it("formatTime and formatDate return empty for missing", () => {
    expect(formatTime(null)).toBe("");
    expect(formatDate(undefined)).toBe("");
    expect(formatDateTime("")).toBe("");
  });

  it("formatTime/formatDate/formatDateTime produce non-empty strings for valid ISO", () => {
    expect(formatTime("2026-06-06T12:30:00Z")).not.toBe("");
    expect(formatDate("2026-06-06T12:30:00Z")).not.toBe("");
    expect(formatDateTime("2026-06-06T12:30:00Z")).toContain("·");
  });
});
