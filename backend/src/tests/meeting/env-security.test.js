import { describe, it, expect, beforeEach, afterEach } from "vitest";

const ORIGINAL_ENV = { ...process.env };
const OLD_NODE_ENV = process.env.NODE_ENV;

const setEnv = (vars) => {
  Object.keys(vars).forEach((k) => { process.env[k] = vars[k]; });
};

const resetEnv = () => {
  Object.keys(process.env).forEach((k) => { delete process.env[k]; });
  Object.entries(ORIGINAL_ENV).forEach(([k, v]) => { process.env[k] = v; });
  process.env.NODE_ENV = OLD_NODE_ENV;
};

const importEnv = async (vars) => {
  setEnv(vars);
  return import("../../config/env.js");
};

describe("Env Validation — Secret Security", () => {
  const REQUIRED_VARS = {
    MONGO_URI: "mongodb://localhost:27017/test",
    JWT_SECRET: "super-secure-key-thats-long-enough",
    JWT_REFRESH_SECRET: "another-secure-refresh-key-here",
    LIVE_CLASSROOM_SECRET: "live-classroom-long-secret",
  };

  beforeEach(() => {
    process.env.NODE_ENV = "development";
  });

  afterEach(() => {
    resetEnv();
  });

  it("rejects placeholder secrets", async () => {
    const env = await importEnv({ ...REQUIRED_VARS, JWT_SECRET: "change-me-in-production" });
    expect(() => env.getEnv()).toThrow("placeholder");
  });

  it("rejects secrets under minimum length", async () => {
    const env = await importEnv({ ...REQUIRED_VARS, JWT_SECRET: "short" });
    expect(() => env.getEnv()).toThrow("at least 16 characters");
  });

  it("rejects empty secrets", async () => {
    const env = await importEnv({ ...REQUIRED_VARS, JWT_SECRET: "" });
    expect(() => env.getEnv()).toThrow("JWT_SECRET is required");
  });

  it("rejects 'secret-key' pattern", async () => {
    const env = await importEnv({ ...REQUIRED_VARS, LIVE_CLASSROOM_SECRET: "my-secret-key-value" });
    expect(() => env.getEnv()).toThrow("placeholder");
  });

  it("rejects 'default' as secret", async () => {
    const env = await importEnv({ ...REQUIRED_VARS, JWT_REFRESH_SECRET: "default-refresh-secret!!" });
    expect(() => env.getEnv()).toThrow("placeholder");
  });

  it("rejects 'changeme' variant", async () => {
    const env = await importEnv({ ...REQUIRED_VARS, JWT_SECRET: "changeme-value-here" });
    expect(() => env.getEnv()).toThrow("placeholder");
  });

  it("requires MONGO_URI in non-test mode", async () => {
    process.env.NODE_ENV = "development";
    const env = await importEnv({ ...REQUIRED_VARS, MONGO_URI: "" });
    expect(() => env.getEnv()).toThrow("MONGO_URI is required");
  });

  it("allows empty MONGO_URI in test mode", async () => {
    process.env.NODE_ENV = "test";
    const env = await importEnv({ ...REQUIRED_VARS, MONGO_URI: "" });
    expect(() => env.getEnv()).not.toThrow();
  });

  it("accepts valid strong secrets", async () => {
    const strong = Array(32).fill("a").join("");
    const env = await importEnv({
      ...REQUIRED_VARS,
      JWT_SECRET: strong,
      JWT_REFRESH_SECRET: strong,
      LIVE_CLASSROOM_SECRET: strong,
    });
    expect(() => env.getEnv()).not.toThrow();
  });
});
