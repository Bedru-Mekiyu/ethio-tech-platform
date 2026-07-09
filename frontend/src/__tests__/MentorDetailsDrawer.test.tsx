import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const mockDetailData = {
  application: {
    _id: "app-1",
    fullName: "Test Mentor",
    email: "test@example.com",
    status: "pending_review",
    currentRole: "Senior Engineer",
    currentCompany: "Tech Co",
    yearsExperience: 8,
    location: "Addis Ababa",
    whyMentor: "I want to help students grow.",
    expertise: ["React", "Node.js", "TypeScript"],
    reviewNotes: undefined,
    rejectionReason: undefined,
    rejectionHistory: [],
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2025-01-01T00:00:00Z",
  },
  user: {
    id: "user-1",
    fullName: "Test Mentor",
    email: "test@example.com",
    role: "mentor",
    avatarUrl: "/avatars/mentor-01.svg",
    mentorAccountStatus: "invited",
    lastLoginAt: null,
  },
  teaching: {
    sessions: [{ title: "React Basics", status: "completed" }],
    studentsCount: 5,
    totalSessions: 12,
  },
  credentialsStatus: {
    provisionedAt: null,
    sentAt: null,
    deliveryMethod: null,
  },
};

const mockLoginHistoryWithDevices = {
  lastLoginAt: "2025-06-01T10:00:00Z",
  lastLoginIp: "192.168.1.1",
  devices: [
    { type: "web", userAgent: "Chrome", ip: "192.168.1.1", lastUsedAt: "2025-06-01T10:00:00Z" },
    { type: "mobile", userAgent: "Safari", ip: "10.0.0.1", lastUsedAt: "2025-05-15T08:00:00Z" },
  ],
  activeSessions: 2,
};

const mockLoginHistory = {
  lastLoginAt: null,
  lastLoginIp: null,
  devices: [],
  activeSessions: 0,
};

vi.mock("@/services/mentorApplicationService", () => ({
  fetchApplicationDetail: vi.fn().mockResolvedValue(mockDetailData),
  fetchLoginHistory: vi.fn().mockResolvedValue(mockLoginHistory),
  approveApplication: vi.fn().mockResolvedValue({}),
  rejectApplication: vi.fn().mockResolvedValue({}),
  requestChanges: vi.fn().mockResolvedValue({}),
  startReview: vi.fn().mockResolvedValue({}),
  provisionApplication: vi.fn().mockResolvedValue({}),
  resendCredentials: vi.fn().mockResolvedValue({}),
  resetMentorPassword: vi.fn().mockResolvedValue({}),
  archiveApplication: vi.fn().mockResolvedValue({}),
  suspendMentor: vi.fn().mockResolvedValue({}),
  reactivateMentor: vi.fn().mockResolvedValue({}),
  deactivateMentor: vi.fn().mockResolvedValue({}),
  removeMentorRole: vi.fn().mockResolvedValue({}),
}));

vi.mock("@/store/authStore", () => ({
  useAuthStore: vi.fn((selector) => {
    const state = {
      user: { role: "admin", id: "admin-1" },
    };
    return selector(state);
  }),
}));

vi.mock("@/components/composites/ToastProvider", () => ({
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn(),
  }),
}));

function Wrapper({ children }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return React.createElement(QueryClientProvider, { client: queryClient }, children);
}

describe("MentorDetailsDrawer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders mentor application details when opened", async () => {
    const { MentorDetailsDrawer } = await import("@/components/admin/MentorDetailsDrawer");

    const onClose = vi.fn();
    const onUpdated = vi.fn();

    render(
      React.createElement(MentorDetailsDrawer, {
        applicationId: "app-1",
        onClose,
        onUpdated,
      }),
      { wrapper: Wrapper }
    );

    await waitFor(() => {
      expect(screen.getByText("Test Mentor")).toBeTruthy();
    });

    expect(screen.getByText("test@example.com")).toBeTruthy();
    expect(screen.getByText("pending review")).toBeTruthy();
    expect(screen.getByText("invited")).toBeTruthy();
  });

  it("shows action buttons for pending review applications", async () => {
    const { MentorDetailsDrawer } = await import("@/components/admin/MentorDetailsDrawer");

    render(
      React.createElement(MentorDetailsDrawer, {
        applicationId: "app-1",
        onClose: vi.fn(),
        onUpdated: vi.fn(),
      }),
      { wrapper: Wrapper }
    );

    await waitFor(() => {
      expect(screen.getByText("Approve")).toBeTruthy();
      expect(screen.getByText("Reject")).toBeTruthy();
      expect(screen.getByText("Request changes")).toBeTruthy();
      expect(screen.getByText("Start review")).toBeTruthy();
    });
  });

  it("shows mentor avatar when available", async () => {
    const { MentorDetailsDrawer } = await import("@/components/admin/MentorDetailsDrawer");

    render(
      React.createElement(MentorDetailsDrawer, {
        applicationId: "app-1",
        onClose: vi.fn(),
        onUpdated: vi.fn(),
      }),
      { wrapper: Wrapper }
    );

    await waitFor(() => {
      const avatar = screen.getByAltText("Test Mentor");
      expect(avatar).toBeTruthy();
    });
  });

  it("displays login history with devices", async () => {
    const fetchLoginHistory = (await import("@/services/mentorApplicationService")).fetchLoginHistory;
    fetchLoginHistory.mockResolvedValue(mockLoginHistoryWithDevices);

    const { MentorDetailsDrawer } = await import("@/components/admin/MentorDetailsDrawer");

    render(
      React.createElement(MentorDetailsDrawer, {
        applicationId: "app-1",
        onClose: vi.fn(),
        onUpdated: vi.fn(),
      }),
      { wrapper: Wrapper }
    );

    await waitFor(() => {
      expect(screen.getByText("Last IP:")).toBeTruthy();
      expect(screen.getByText("192.168.1.1")).toBeTruthy();
      expect(screen.getByText("Active sessions:")).toBeTruthy();
      expect(screen.getByText("2")).toBeTruthy();
      expect(screen.getByText("web")).toBeTruthy();
      expect(screen.getByText("mobile")).toBeTruthy();
    });
  });

  it("displays teaching stats", async () => {
    const { MentorDetailsDrawer } = await import("@/components/admin/MentorDetailsDrawer");

    render(
      React.createElement(MentorDetailsDrawer, {
        applicationId: "app-1",
        onClose: vi.fn(),
        onUpdated: vi.fn(),
      }),
      { wrapper: Wrapper }
    );

    await waitFor(() => {
      expect(screen.getByText("12")).toBeTruthy();
      expect(screen.getByText("5")).toBeTruthy();
    });
  });
});
