import { describe, expect, it, vi, beforeAll } from "vitest";
import request from "supertest";
import { createApp } from "../app.js";

vi.mock("../models/User.js", () => ({
  default: {
    findById: vi.fn(),
    findOne: vi.fn(),
    find: vi.fn(),
    countDocuments: vi.fn(),
  },
}));

vi.mock("../lib/logger.js", () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

describe("API Integration", () => {
  const app = createApp();

  describe("CORS and Security Headers", () => {
    it("sets helmet security headers", async () => {
      const res = await request(app).get("/health");
      expect(res.headers["x-content-type-options"]).toBe("nosniff");
      expect(res.headers["x-frame-options"]).toBe("SAMEORIGIN");
    });

    it("removes x-powered-by header", async () => {
      const res = await request(app).get("/health");
      expect(res.headers["x-powered-by"]).toBeUndefined();
    });
  });

  describe("Health Endpoint", () => {
    it("returns 200 with status OK", async () => {
      const res = await request(app).get("/health");
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        status: "OK",
        mission: "Building Ethiopia's tech future",
        version: "v1",
      });
      expect(res.body.timestamp).toBeDefined();
    });

    it("includes request id header", async () => {
      const res = await request(app).get("/health");
      expect(res.headers["x-request-id"]).toBeDefined();
    });
  });

  describe("404 Handling", () => {
    it("returns 404 for unknown routes", async () => {
      const res = await request(app).get("/api/v1/nonexistent");
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe("API Versioning", () => {
    it("routes admin endpoints under /api/v1 prefix", async () => {
      const res = await request(app).get("/api/v1/health");
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });
});
