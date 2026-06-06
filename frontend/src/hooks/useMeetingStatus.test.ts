import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

vi.mock("@/services/meetingsService", () => ({
  fetchMeetingStatus: vi.fn(),
}));

type Listener = (payload: unknown) => void;
const listeners: Record<string, Listener[]> = {};

vi.mock("@/services/socket", () => ({
  acquireSocketConnection: vi.fn(() => ({
    on: (event: string, cb: Listener) => {
      listeners[event] = listeners[event] ?? [];
      listeners[event].push(cb);
    },
    off: (event: string, cb: Listener) => {
      listeners[event] = (listeners[event] ?? []).filter((c) => c !== cb);
    },
    emit: vi.fn(),
    connected: true,
  })),
  releaseSocketConnection: vi.fn(),
}));

import { useMeetingStatus, useGlobalMeetingEvents } from "./useMeetingStatus";
import * as meetingsService from "@/services/meetingsService";

const createWrapper = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
};

const baseMeetingPayload = {
  id: "s1",
  sessionId: "s1",
  title: "Algebra deep-dive",
  mentorId: "m1",
  mentorName: "Mentor One",
  mentorAvatar: null,
  studentId: null,
  studentName: "",
  scheduledAt: "2099-06-06T12:00:00Z",
  durationMinutes: 60,
  status: "scheduled" as const,
  hostJoined: false,
  presenceCount: 0,
  startsInMs: null,
  endsAt: null,
  liveRoomId: null,
  classroomMode: "immersive-3d" as const,
  liveProvider: "jitsi" as const,
  joinable: false,
  isHost: false,
  isAdmin: false,
  isParticipant: true,
  joinHref: "/app/classroom/s1",
};

describe("useMeetingStatus", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    for (const key of Object.keys(listeners)) {
      delete listeners[key];
    }
  });

  it("returns scheduled status for future meeting", async () => {
    vi.mocked(meetingsService.fetchMeetingStatus).mockResolvedValue({
      meeting: baseMeetingPayload,
      canJoin: true,
    });
    const { result } = renderHook(() => useMeetingStatus({ sessionId: "s1" }), {
      wrapper: createWrapper(),
    });
    await waitFor(() => {
      expect(result.current.status).toBe("scheduled");
    });
  });

  it("returns undefined status when no sessionId is provided", async () => {
    const { result } = renderHook(() => useMeetingStatus({ sessionId: null, enabled: false }), {
      wrapper: createWrapper(),
    });
    expect(result.current.isLoading).toBe(false);
  });

  it("updates status on socket event", async () => {
    vi.mocked(meetingsService.fetchMeetingStatus).mockResolvedValue({
      meeting: baseMeetingPayload,
      canJoin: true,
    });
    const { result } = renderHook(() => useMeetingStatus({ sessionId: "s1" }), {
      wrapper: createWrapper(),
    });
    await waitFor(() => {
      expect(result.current.status).toBe("scheduled");
    });

    await act(async () => {
      const handlers = listeners["meeting:status-changed"] ?? [];
      handlers.forEach((cb: (p: unknown) => void) =>
        cb({
          sessionId: "s1",
          status: "active",
          hostJoined: true,
          presenceCount: 2,
          at: new Date().toISOString(),
        }),
      );
    });

    await waitFor(() => {
      expect(result.current.status).toBe("active");
    });
    expect(result.current.hostJoined).toBe(true);
  });

  it("ignores socket events for other sessionIds", async () => {
    vi.mocked(meetingsService.fetchMeetingStatus).mockResolvedValue({
      meeting: baseMeetingPayload,
      canJoin: true,
    });
    const { result } = renderHook(() => useMeetingStatus({ sessionId: "s1" }), {
      wrapper: createWrapper(),
    });
    await waitFor(() => {
      expect(result.current.status).toBe("scheduled");
    });

    act(() => {
      const handlers = listeners["meeting:status-changed"] ?? [];
      handlers.forEach((cb: (p: unknown) => void) =>
        cb({
          sessionId: "different-id",
          status: "active",
          hostJoined: true,
          at: new Date().toISOString(),
        }),
      );
    });

    expect(result.current.status).toBe("scheduled");
  });
});

describe("useGlobalMeetingEvents", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    for (const key of Object.keys(listeners)) {
      delete listeners[key];
    }
  });

  it("invokes the onChange callback with payload", async () => {
    const onChange = vi.fn();
    renderHook(() => useGlobalMeetingEvents(onChange), { wrapper: createWrapper() });

    const payload = {
      sessionId: "s1",
      status: "active" as const,
      hostJoined: true,
      presenceCount: 3,
      at: new Date().toISOString(),
    };

    act(() => {
      const handlers = listeners["meeting:status-changed"] ?? [];
      handlers.forEach((cb: (p: unknown) => void) => cb(payload));
    });

    expect(onChange).toHaveBeenCalledWith(payload);
  });

  it("does not throw when onChange is omitted", () => {
    expect(() => renderHook(() => useGlobalMeetingEvents(), { wrapper: createWrapper() })).not.toThrow();
  });
});
