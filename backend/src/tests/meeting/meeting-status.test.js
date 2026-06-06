import { describe, it, expect } from "vitest";
import {
  deriveMeetingStatus,
  getMeetingJoinable,
  toMeetingViewModel,
  MEETING_STATUSES,
} from "../../services/meetingService.js";

const buildSession = (overrides = {}) => ({
  _id: "s1",
  title: "Career mentorship",
  status: "scheduled",
  scheduledAt: new Date(Date.now() + 30 * 60 * 1000),
  durationMinutes: 60,
  liveStartedAt: null,
  liveEndedAt: null,
  mentor: { _id: "m1", fullName: "Mentor M", avatar: null },
  participants: [{ _id: "u1", fullName: "Student A" }],
  liveRoomId: "session-s1",
  ...overrides,
});

const viewerStudent = { _id: "u1", role: "student" };
const viewerMentor = { _id: "m1", role: "mentor" };
const viewerOtherStudent = { _id: "u9", role: "student" };
const viewerAdmin = { _id: "a1", role: "admin" };

describe("deriveMeetingStatus", () => {
  it("returns 'scheduled' when far in the future", () => {
    const session = buildSession({
      scheduledAt: new Date(Date.now() + 60 * 60 * 1000),
    });
    expect(deriveMeetingStatus({ session })).toBe("scheduled");
  });

  it("returns 'waiting_for_host' when scheduled time reached but host absent", () => {
    const session = buildSession({
      scheduledAt: new Date(Date.now() - 1 * 60 * 1000),
    });
    expect(deriveMeetingStatus({ session, hostJoined: false })).toBe("waiting_for_host");
  });

  it("returns 'active' when host has joined", () => {
    const session = buildSession({
      scheduledAt: new Date(Date.now() - 1 * 60 * 1000),
    });
    expect(deriveMeetingStatus({ session, hostJoined: true })).toBe("active");
  });

  it("returns 'active' for status='live'", () => {
    const session = buildSession({ status: "live" });
    expect(deriveMeetingStatus({ session })).toBe("active");
  });

  it("returns 'active' for status='paused'", () => {
    const session = buildSession({ status: "paused" });
    expect(deriveMeetingStatus({ session })).toBe("active");
  });

  it("returns 'completed' for status='ended'", () => {
    const session = buildSession({ status: "ended" });
    expect(deriveMeetingStatus({ session })).toBe("completed");
  });

  it("returns 'cancelled' for status='canceled'", () => {
    const session = buildSession({ status: "canceled" });
    expect(deriveMeetingStatus({ session })).toBe("cancelled");
  });

  it("returns 'completed' after duration elapses without explicit end", () => {
    const session = buildSession({
      scheduledAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      durationMinutes: 60,
    });
    expect(deriveMeetingStatus({ session })).toBe("completed");
  });

  it("returns 'scheduled' for a null session", () => {
    expect(deriveMeetingStatus({ session: null })).toBe("scheduled");
  });

  it("treats registration_closed as scheduled until time", () => {
    const session = buildSession({
      status: "registration_closed",
      scheduledAt: new Date(Date.now() + 10 * 60 * 1000),
    });
    expect(deriveMeetingStatus({ session })).toBe("scheduled");
  });

  it("exposes a fixed enum of meeting statuses", () => {
    expect(MEETING_STATUSES).toEqual(["scheduled", "waiting_for_host", "active", "completed", "cancelled"]);
  });
});

describe("getMeetingJoinable", () => {
  it("blocks cancelled meetings", () => {
    const session = buildSession({ status: "canceled" });
    expect(getMeetingJoinable({ session, status: "cancelled", viewer: viewerStudent })).toBe(false);
  });

  it("blocks completed meetings", () => {
    const session = buildSession({ status: "ended" });
    expect(getMeetingJoinable({ session, status: "completed", viewer: viewerStudent })).toBe(false);
  });

  it("allows the assigned mentor", () => {
    const session = buildSession();
    expect(getMeetingJoinable({ session, status: "scheduled", viewer: viewerMentor })).toBe(true);
  });

  it("allows the listed student", () => {
    const session = buildSession();
    expect(getMeetingJoinable({ session, status: "scheduled", viewer: viewerStudent })).toBe(true);
  });

  it("blocks a student not on the participant list", () => {
    const session = buildSession();
    expect(getMeetingJoinable({ session, status: "scheduled", viewer: viewerOtherStudent })).toBe(false);
  });

  it("always allows admins", () => {
    const session = buildSession({ status: "ended" });
    expect(getMeetingJoinable({ session, status: "completed", viewer: viewerAdmin })).toBe(true);
  });
});

describe("toMeetingViewModel", () => {
  it("builds a view model with status, host presence, and join href", () => {
    const session = buildSession({
      scheduledAt: new Date(Date.now() - 1 * 60 * 1000),
    });
    const view = toMeetingViewModel(session, {
      hostJoined: true,
      presenceCount: 3,
      viewer: viewerStudent,
    });
    expect(view.id).toBe("s1");
    expect(view.title).toBe("Career mentorship");
    expect(view.mentorId).toBe("m1");
    expect(view.mentorName).toBe("Mentor M");
    expect(view.status).toBe("active");
    expect(view.hostJoined).toBe(true);
    expect(view.presenceCount).toBe(3);
    expect(view.joinable).toBe(true);
    expect(view.isHost).toBe(false);
    expect(view.isParticipant).toBe(true);
    expect(view.joinHref).toBe("/app/classroom/s1");
    expect(view.startsInMs).toBe(0);
  });

  it("marks isHost=true for the mentor", () => {
    const session = buildSession();
    const view = toMeetingViewModel(session, {
      hostJoined: true,
      presenceCount: 1,
      viewer: viewerMentor,
    });
    expect(view.isHost).toBe(true);
    expect(view.isParticipant).toBe(false);
  });

  it("marks isAdmin=true for an admin viewer", () => {
    const session = buildSession();
    const view = toMeetingViewModel(session, {
      hostJoined: false,
      presenceCount: 0,
      viewer: viewerAdmin,
    });
    expect(view.isAdmin).toBe(true);
  });

  it("includes endsAt derived from durationMinutes", () => {
    const fixed = new Date("2030-01-01T10:00:00.000Z");
    const session = buildSession({ scheduledAt: fixed, durationMinutes: 30 });
    const view = toMeetingViewModel(session, { viewer: viewerStudent });
    expect(view.endsAt).toBe(new Date(fixed.getTime() + 30 * 60 * 1000).toISOString());
  });

  it("returns null for a null session", () => {
    expect(toMeetingViewModel(null, { viewer: viewerStudent })).toBe(null);
  });
});
