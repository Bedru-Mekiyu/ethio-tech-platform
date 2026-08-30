import { describe, it, expect, vi } from "vitest";
import {
  generateRoomName,
  generateLiveKitToken,
  getPublicLiveKitConfig,
} from "../../services/livekitService.js";

describe("LiveKit Session Service", () => {
  it("generates deterministic session room name", () => {
    const roomName = generateRoomName("65f123456789abcdef123456");
    expect(roomName).toBe("session_65f123456789abcdef123456");
  });

  it("returns public LiveKit configuration", () => {
    const config = getPublicLiveKitConfig();
    expect(config).toHaveProperty("url");
    expect(config).toHaveProperty("enabled");
  });

  it("generates LiveKit token for participant", async () => {
    const user = {
      _id: "user_student_123",
      fullName: "Almaz Kebede",
      avatar: "https://example.com/avatar.jpg",
    };

    const tokenData = await generateLiveKitToken({
      sessionId: "session_abc",
      user,
      role: "participant",
    });

    expect(tokenData).toHaveProperty("token");
    expect(tokenData.token.length).toBeGreaterThan(20);
    expect(tokenData.roomName).toBe("session_session_abc");
    expect(tokenData.identity).toBe("user_student_123");
    expect(tokenData.role).toBe("participant");
  });

  it("generates LiveKit token with host permissions for mentor", async () => {
    const user = {
      _id: "user_mentor_456",
      fullName: "Dr. Aster",
    };

    const tokenData = await generateLiveKitToken({
      sessionId: "session_xyz",
      user,
      role: "host",
    });

    expect(tokenData).toHaveProperty("token");
    expect(tokenData.role).toBe("host");
    expect(tokenData.identity).toBe("user_mentor_456");
  });
});
