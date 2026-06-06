import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

vi.mock("@/services/meetingsService", () => ({
  fetchAdminMeetings: vi.fn(),
  forceEndMeeting: vi.fn(),
  fetchMeetingStatus: vi.fn(),
}));

vi.mock("@/services/socket", () => ({
  acquireSocketConnection: vi.fn(() => ({ on: vi.fn(), off: vi.fn(), emit: vi.fn() })),
  releaseSocketConnection: vi.fn(),
  getSocket: vi.fn(() => ({ on: vi.fn(), off: vi.fn(), emit: vi.fn() })),
}));

vi.mock("@/hooks/usePageTitle", () => ({
  usePageTitle: vi.fn(),
}));

import { AdminMeetingsPage } from "./AdminMeetingsPage";
import { ToastProvider } from "@/components/composites/ToastProvider";
import * as meetingsService from "@/services/meetingsService";

const meeting = (overrides = {}) => ({
  id: "s1",
  sessionId: "s1",
  title: "Algebra deep-dive",
  mentorId: "m1",
  mentorName: "Mentor One",
  mentorAvatar: null,
  studentId: "st1",
  studentName: "Student One",
  scheduledAt: "2026-06-06T12:00:00Z",
  durationMinutes: 60,
  status: "scheduled" as const,
  hostJoined: false,
  presenceCount: 0,
  startsInMs: 30 * 60_000,
  endsAt: "2026-06-06T13:00:00Z",
  liveRoomId: null,
  classroomMode: "immersive-3d" as const,
  liveProvider: "jitsi" as const,
  joinable: true,
  isHost: false,
  isAdmin: true,
  isParticipant: false,
  joinHref: "/app/classroom/s1",
  ...overrides,
});

const renderPage = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <MemoryRouter>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <AdminMeetingsPage />
        </ToastProvider>
      </QueryClientProvider>
    </MemoryRouter>,
  );
};

describe("AdminMeetingsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the four tabs", async () => {
    vi.mocked(meetingsService.fetchAdminMeetings).mockResolvedValue({
      meetings: [meeting()],
      pagination: { page: 1, perPage: 20, total: 1, hasMore: false },
    });
    renderPage();
    await waitFor(() => {
      expect(screen.getByTestId("admin-meetings-tab-scheduled")).toBeTruthy();
    });
    expect(screen.getByTestId("admin-meetings-tab-active")).toBeTruthy();
    expect(screen.getByTestId("admin-meetings-tab-completed")).toBeTruthy();
    expect(screen.getByTestId("admin-meetings-tab-cancelled")).toBeTruthy();
  });

  it("shows meeting card when meeting is loaded", async () => {
    vi.mocked(meetingsService.fetchAdminMeetings).mockResolvedValue({
      meetings: [meeting({ status: "active", hostJoined: true, presenceCount: 4 })],
      pagination: { page: 1, perPage: 20, total: 1, hasMore: false },
    });
    renderPage();
    await waitFor(() => {
      expect(screen.getByTestId("admin-meetings-tab-active")).toBeTruthy();
    });
    fireEvent.click(screen.getByTestId("admin-meetings-tab-active"));
    await waitFor(() => {
      expect(screen.getByText("Algebra deep-dive")).toBeTruthy();
    });
  });

  it("shows empty state when no meetings match tab", async () => {
    vi.mocked(meetingsService.fetchAdminMeetings).mockResolvedValue({
      meetings: [meeting({ status: "cancelled" })],
      pagination: { page: 1, perPage: 20, total: 1, hasMore: false },
    });
    renderPage();
    await waitFor(() => {
      expect(screen.getByTestId("admin-meetings-tab-scheduled")).toBeTruthy();
    });
    fireEvent.click(screen.getByTestId("admin-meetings-tab-scheduled"));
    await waitFor(() => {
      expect(screen.getByText("No scheduled meetings")).toBeTruthy();
    });
  });

  it("filters meetings by selected tab", async () => {
    vi.mocked(meetingsService.fetchAdminMeetings).mockResolvedValue({
      meetings: [meeting({ id: "s1", status: "active", hostJoined: true }), meeting({ id: "s2", status: "scheduled" })],
      pagination: { page: 1, perPage: 20, total: 2, hasMore: false },
    });
    renderPage();
    await waitFor(() => {
      expect(screen.getByTestId("admin-meetings-tab-scheduled")).toBeTruthy();
    });
    fireEvent.click(screen.getByTestId("admin-meetings-tab-active"));
    await waitFor(() => {
      expect(screen.getAllByText("Algebra deep-dive").length).toBeGreaterThan(0);
    });
    fireEvent.click(screen.getByTestId("admin-meetings-tab-scheduled"));
    await waitFor(() => {
      expect(screen.getAllByText("Algebra deep-dive").length).toBeGreaterThan(0);
    });
  });

  it("triggers forceEnd mutation when admin clicks force end", async () => {
    vi.mocked(meetingsService.fetchAdminMeetings).mockResolvedValue({
      meetings: [meeting({ status: "active", hostJoined: true })],
      pagination: { page: 1, perPage: 20, total: 1, hasMore: false },
    });
    vi.mocked(meetingsService.forceEndMeeting).mockResolvedValue({});
    const promptSpy = vi.spyOn(window, "prompt").mockReturnValue("Admin ended the meeting");

    renderPage();
    await waitFor(() => {
      expect(screen.getByTestId("admin-meetings-tab-active")).toBeTruthy();
    });
    fireEvent.click(screen.getByTestId("admin-meetings-tab-active"));
    await waitFor(() => {
      expect(screen.getByTestId("admin-meetings-force-end")).toBeTruthy();
    });
    fireEvent.click(screen.getByTestId("admin-meetings-force-end"));

    await waitFor(() => {
      expect(meetingsService.forceEndMeeting).toHaveBeenCalledWith("s1", "Admin ended the meeting");
    });
    promptSpy.mockRestore();
  });

  it("does not call forceEnd if admin cancels prompt", async () => {
    vi.mocked(meetingsService.fetchAdminMeetings).mockResolvedValue({
      meetings: [meeting({ status: "active", hostJoined: true })],
      pagination: { page: 1, perPage: 20, total: 1, hasMore: false },
    });
    const promptSpy = vi.spyOn(window, "prompt").mockReturnValue(null);

    renderPage();
    await waitFor(() => {
      expect(screen.getByTestId("admin-meetings-tab-active")).toBeTruthy();
    });
    fireEvent.click(screen.getByTestId("admin-meetings-tab-active"));
    await waitFor(() => {
      expect(screen.getByTestId("admin-meetings-force-end")).toBeTruthy();
    });
    fireEvent.click(screen.getByTestId("admin-meetings-force-end"));

    expect(meetingsService.forceEndMeeting).not.toHaveBeenCalled();
    promptSpy.mockRestore();
  });

  it("renders skeleton while loading", () => {
    vi.mocked(meetingsService.fetchAdminMeetings).mockReturnValue(new Promise(() => {}));
    const { container } = renderPage();
    const skeletons = container.querySelectorAll('[class*="animate-pulse"], [class*="skeleton"]');
    expect(skeletons.length > 0).toBeTruthy();
  });
});
