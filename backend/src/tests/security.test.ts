import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../app.js";

describe("backend security defaults", () => {
  it("does not expose x-powered-by headers", async () => {
    const app = createApp();
    const res = await request(app).get("/health");

    expect(res.status).toBe(200);
    expect(res.headers["x-powered-by"]).toBeUndefined();
  });
});
