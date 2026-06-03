import { describe, it, expect } from "vitest";
import SessionParticipant from "../../models/SessionParticipant.js";
import SessionAuditLog from "../../models/SessionAuditLog.js";

describe("SessionParticipant Model Schema", () => {
  it("has the correct schema fields", () => {
    const paths = SessionParticipant.schema.paths;
    expect(paths.session).toBeDefined();
    expect(paths.user).toBeDefined();
    expect(paths.status).toBeDefined();
    expect(paths.role).toBeDefined();
    expect(paths.verifiedAttendance).toBeDefined();
    expect(paths.xpAwarded).toBeDefined();
    expect(paths.totalPresenceMs).toBeDefined();
  });

  it("has unique compound index on session and user", () => {
    const indexes = SessionParticipant.schema.indexes();
    const hasUnique = indexes.some(
      ([fields]) => fields.session === 1 && fields.user === 1
    );
    expect(hasUnique).toBe(true);
  });

  it("status enum includes expected values", () => {
    const statusEnum = SessionParticipant.schema.paths.status.enumValues;
    expect(statusEnum).toContain("joined");
    expect(statusEnum).toContain("active");
    expect(statusEnum).toContain("completed");
    expect(statusEnum).toContain("absent");
  });

  it("role enum includes expected values", () => {
    const roleEnum = SessionParticipant.schema.paths.role.enumValues;
    expect(roleEnum).toContain("host");
    expect(roleEnum).toContain("participant");
    expect(roleEnum).toContain("observer");
  });
});

describe("SessionAuditLog Model Schema", () => {
  it("has the correct schema fields", () => {
    const paths = SessionAuditLog.schema.paths;
    expect(paths.session).toBeDefined();
    expect(paths.action).toBeDefined();
    expect(paths.actor).toBeDefined();
    expect(paths.targetUser).toBeDefined();
    expect(paths.metadata).toBeDefined();
  });

  it("action enum includes session lifecycle events", () => {
    const actions = SessionAuditLog.schema.paths.action.enumValues;
    expect(actions).toContain("started");
    expect(actions).toContain("ended");
    expect(actions).toContain("cancelled");
    expect(actions).toContain("rescheduled");
    expect(actions).toContain("xp_awarded");
  });
});
