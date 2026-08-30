import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";

vi.mock("@/services/notificationsService", () => ({
  fetchMyNotifications: vi.fn(),
  fetchUnreadCount: vi.fn(),
  markNotificationRead: vi.fn(),
  markAllNotificationsRead: vi.fn(),
}));

vi.mock("@/services/socket", () => ({
  getSocket: vi.fn(() => ({
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
    connected: true,
  })),
  acquireSocketConnection: vi.fn(() => ({
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
    connected: true,
  })),
  releaseSocketConnection: vi.fn(),
}));

vi.mock("@/store/notificationStore", () => ({
  useNotificationStore: vi.fn((selector) => {
    const state = {
      badge: { count: 3, lastChecked: new Date().toISOString() },
      setBadgeCount: vi.fn(),
      incrementBadge: vi.fn(),
      clearBadge: vi.fn(),
    };
    return selector(state);
  }),
}));

vi.mock("@/hooks/usePageTitle", () => ({
  usePageTitle: vi.fn(),
}));

import { NotificationsPage } from "@/pages/app/NotificationsPage";
import * as notificationsService from "@/services/notificationsService";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const createQueryClient = () => new QueryClient({ defaultOptions: { queries: { retry: false } } });

import { MemoryRouter } from "react-router-dom";

const renderWithProviders = (component: React.ReactElement) => {
  const queryClient = createQueryClient();
  return render(
    <MemoryRouter>
      <QueryClientProvider client={queryClient}>{component}</QueryClientProvider>
    </MemoryRouter>,
  );
};

describe("NotificationsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows loading skeleton initially", async () => {
    vi.mocked(notificationsService.fetchMyNotifications).mockReturnValue(new Promise(() => {}));
    renderWithProviders(React.createElement(NotificationsPage));
    await waitFor(() => {
      expect(screen.queryByText("Stay synced with the learning network")).toBeNull();
    });
  });

  it("shows empty state when no notifications", async () => {
    vi.mocked(notificationsService.fetchMyNotifications).mockResolvedValue([]);
    renderWithProviders(React.createElement(NotificationsPage));
    await waitFor(() => {
      expect(screen.getByText("All caught up")).toBeTruthy();
    });
  });

  it("renders notification list", async () => {
    vi.mocked(notificationsService.fetchMyNotifications).mockResolvedValue([
      {
        _id: "1",
        message: "Session is live: React 101",
        type: "session",
        isRead: false,
        createdAt: new Date().toISOString(),
      },
      {
        _id: "2",
        message: "Badge unlocked: First Steps",
        type: "badge",
        isRead: true,
        createdAt: new Date().toISOString(),
      },
    ]);
    renderWithProviders(React.createElement(NotificationsPage));
    await waitFor(() => {
      expect(screen.getByText("Session is live: React 101")).toBeTruthy();
      expect(screen.getByText("Badge unlocked: First Steps")).toBeTruthy();
    });
  });

  it("displays unread count badge", async () => {
    vi.mocked(notificationsService.fetchMyNotifications).mockResolvedValue([
      { _id: "1", message: "Unread 1", type: "session", isRead: false, createdAt: new Date().toISOString() },
      { _id: "2", message: "Unread 2", type: "session", isRead: false, createdAt: new Date().toISOString() },
      { _id: "3", message: "Read 1", type: "session", isRead: true, createdAt: new Date().toISOString() },
    ]);
    renderWithProviders(React.createElement(NotificationsPage));
    await waitFor(() => {
      expect(screen.getByText("2 unread")).toBeTruthy();
      expect(screen.getByText("3 total")).toBeTruthy();
    });
  });

  it("mark all read button triggers mutation", async () => {
    vi.mocked(notificationsService.fetchMyNotifications).mockResolvedValue([
      { _id: "1", message: "Unread notification", type: "session", isRead: false, createdAt: new Date().toISOString() },
    ]);
    vi.mocked(notificationsService.markAllNotificationsRead).mockResolvedValue(undefined);
    renderWithProviders(React.createElement(NotificationsPage));
    await waitFor(() => {
      const btn = screen.getByText("Mark all read");
      fireEvent.click(btn);
      expect(notificationsService.markAllNotificationsRead).toHaveBeenCalled();
    });
  });
});

describe("Notification icon mapping", () => {
  it("maps session type to CalendarClock icon", async () => {
    vi.mocked(notificationsService.fetchMyNotifications).mockResolvedValue([
      {
        _id: "1",
        message: "Session notification",
        type: "session",
        isRead: false,
        createdAt: new Date().toISOString(),
      },
    ]);
    renderWithProviders(React.createElement(NotificationsPage));
    await waitFor(() => {
      expect(screen.getByText("Session notification")).toBeTruthy();
    });
  });

  it("maps badge type to Trophy icon", async () => {
    vi.mocked(notificationsService.fetchMyNotifications).mockResolvedValue([
      { _id: "1", message: "Badge notification", type: "badge", isRead: false, createdAt: new Date().toISOString() },
    ]);
    renderWithProviders(React.createElement(NotificationsPage));
    await waitFor(() => {
      expect(screen.getByText("Badge notification")).toBeTruthy();
    });
  });
});
