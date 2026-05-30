import { describe, expect, it } from "vitest";
import { sanitizeRegisterRole, PUBLIC_REGISTER_ROLES } from "../services/authService.js";
import { getEnv } from "../config/env.js";

describe("auth security helpers", () => {
  it("forces public registration to student-only", () => {
    expect(PUBLIC_REGISTER_ROLES).toEqual(["student"]);
    expect(sanitizeRegisterRole("admin")).toBe("student");
    expect(sanitizeRegisterRole("mentor")).toBe("student");
    expect(sanitizeRegisterRole("parent")).toBe("student");
  });

  it("provides test env secrets when NODE_ENV=test", () => {
    process.env.NODE_ENV = "test";
    const env = getEnv();
    expect(env.jwtSecret.length).toBeGreaterThan(10);
  });
});
