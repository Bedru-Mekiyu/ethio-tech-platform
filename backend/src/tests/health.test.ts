import { describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../app.js";

describe("GET /health", () => {
  it("returns 200 with platform status", async () => {
    const app = createApp();
    const res = await request(app).get("/health");

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      status: "OK",
      mission: "Building Ethiopia's tech future",
      version: "v1",
    });
    expect(res.body.timestamp).toBeDefined();
  });
});

describe("GET /health/realtime", () => {
  it("returns 200 with realtime status", async () => {
    const app = createApp();
    const res = await request(app).get("/health/realtime");

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      status: "OK",
      rooms: 0,
    });
    expect(res.body.timestamp).toBeDefined();
  });
});
