import { describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../app.js";

describe("GET /health/ready", () => {
  it("returns readiness status", async () => {
    const app = createApp();
    const res = await request(app).get("/health/ready");

    expect([200, 503]).toContain(res.status);
    expect(res.body).toHaveProperty("status");
    expect(res.body).toHaveProperty("database");
  });
});
