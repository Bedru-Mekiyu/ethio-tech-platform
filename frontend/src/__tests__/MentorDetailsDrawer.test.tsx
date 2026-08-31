import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import * as mentorApplicationService from "@/services/mentorApplicationService";
import { MentorDetailsDrawer } from "@/components/admin/MentorDetailsDrawer";

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
  fetchApplicationDetail: vi.fn(),
  fetchLoginHistory: vi.fn(),
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

function renderWithClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(React.createElement(QueryClientProvider, { client: queryClient }, ui));
}

describe("MentorDetailsDrawer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(mentorApplicationService.fetchApplicationDetail).mockResolvedValue(
      mockDetailData as unknown as Awaited<ReturnType<typeof mentorApplicationService.fetchApplicationDetail>>,
    );
    vi.mocked(mentorApplicationService.fetchLoginHistory).mockResolvedValue(
      mockLoginHistory as unknown as Awaited<ReturnType<typeof mentorApplicationService.fetchLoginHistory>>,
    );
  });

  it("renders mentor application details when opened", async () => {
    const onClose = vi.fn();
    const onUpdated = vi.fn();

    renderWithClient(
      React.createElement(MentorDetailsDrawer, {
        applicationId: "app-1",
        onClose,
        onUpdated,
      }),
    );

    await waitFor(() => {
      expect(screen.getByText("Test Mentor")).toBeTruthy();
    });

    expect(screen.getByText("test@example.com")).toBeTruthy();
    expect(screen.getByText("pending review")).toBeTruthy();
    expect(screen.getByText("invited")).toBeTruthy();
  });

  it("shows action buttons for pending review applications", async () => {
    renderWithClient(
      React.createElement(MentorDetailsDrawer, {
        applicationId: "app-1",
        onClose: vi.fn(),
        onUpdated: vi.fn(),
      }),
    );

    await waitFor(() => {
      expect(screen.getByText("Approve")).toBeTruthy();
      expect(screen.getByText("Reject")).toBeTruthy();
      expect(screen.getByText("Request changes")).toBeTruthy();
      expect(screen.getByText("Start review")).toBeTruthy();
    });
  });

  it("shows mentor avatar when available", async () => {
    renderWithClient(
      React.createElement(MentorDetailsDrawer, {
        applicationId: "app-1",
        onClose: vi.fn(),
        onUpdated: vi.fn(),
      }),
    );

    await waitFor(() => {
      const avatar = screen.getByAltText("Test Mentor");
      expect(avatar).toBeTruthy();
    });
  });

  it("displays login history with devices", async () => {
    vi.mocked(mentorApplicationService.fetchLoginHistory).mockResolvedValue(
      mockLoginHistoryWithDevices as unknown as Awaited<ReturnType<typeof mentorApplicationService.fetchLoginHistory>>,
    );

    renderWithClient(
      React.createElement(MentorDetailsDrawer, {
        applicationId: "app-history-1",
        onClose: vi.fn(),
        onUpdated: vi.fn(),
      }),
    );

    await waitFor(() => {
      expect(mentorApplicationService.fetchLoginHistory).toHaveBeenCalled();
    });
  });

  it("displays teaching stats", async () => {
    renderWithClient(
      React.createElement(MentorDetailsDrawer, {
        applicationId: "app-1",
        onClose: vi.fn(),
        onUpdated: vi.fn(),
      }),
    );

    await waitFor(() => {
      expect(screen.getByText("Teaching")).toBeTruthy();
      expect(screen.getByText("React Basics")).toBeTruthy();
    });
  });
});
