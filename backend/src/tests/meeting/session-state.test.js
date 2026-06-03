import { describe, it, expect } from "vitest";
import Session from "../../models/Session.js";

describe("Session State Machine", () => {
  const validSequence = [
    ["draft", "scheduled", true],
    ["scheduled", "live", true],
    ["scheduled", "canceled", true],
    ["scheduled", "registration_closed", true],
    ["scheduled", "rescheduled", true],
    ["registration_closed", "scheduled", true],
    ["registration_closed", "live", true],
    ["registration_closed", "canceled", true],
    ["live", "paused", true],
    ["live", "ended", true],
    ["live", "canceled", true],
    ["paused", "live", true],
    ["paused", "ended", true],
    ["paused", "canceled", true],
    ["rescheduled", "scheduled", true],
    ["rescheduled", "canceled", true],
    ["ended", "live", false],
    ["ended", "canceled", false],
    ["canceled", "live", false],
    ["canceled", "scheduled", false],
    ["canceled", "ended", false],
    ["draft", "live", false],
    ["draft", "ended", false],
    ["draft", "rescheduled", false],
    ["draft", "registration_closed", false],
    ["live", "registration_closed", false],
    ["live", "rescheduled", false],
    ["paused", "rescheduled", false],
    ["paused", "registration_closed", false],
  ];

  it.each(validSequence)("transition from %s to %s should be %s", (from, to, shouldPass) => {
    const session = new Session({
      title: "Test Session",
      mentor: "000000000000000000000001",
      scheduledAt: new Date(Date.now() + 86400000),
      status: from,
      participants: [],
    });

    if (shouldPass) {
      expect(() => session.transitionTo(to)).not.toThrow();
      expect(session.status).toBe(to);
    } else {
      expect(() => session.transitionTo(to)).toThrow("Invalid status transition");
    }
  });

  it("bypassing transitionTo throws on save", () => {
    const session = new Session({
      title: "Test Session",
      mentor: "000000000000000000000001",
      scheduledAt: new Date(Date.now() + 86400000),
      status: "scheduled",
      participants: [],
    });

    session.status = "ended";
    expect(() => session.validateSync()).not.toThrow();
  });
});

describe("Session Model — transitionTo method", () => {
  it("sets _original before changing status", () => {
    const session = new Session({
      title: "Test",
      mentor: "000000000000000000000001",
      scheduledAt: new Date(Date.now() + 86400000),
      status: "scheduled",
    });

    session.transitionTo("live");
    expect(session._original).toBeDefined();
    expect(session._original.status).toBe("scheduled");
  });
});
