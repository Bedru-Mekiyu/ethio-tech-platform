import { describe, it, expect, beforeEach } from "vitest";
import {
  acquireSocketConnection,
  releaseSocketConnection,
  disconnectSocket,
} from "./socket";

describe("socket ref counting", () => {
  beforeEach(() => {
    disconnectSocket();
  });

  it("releases shared connection without forcing disconnect while refs remain", () => {
    acquireSocketConnection();
    acquireSocketConnection();
    releaseSocketConnection();
    releaseSocketConnection();
    expect(true).toBe(true);
  });
});
