import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AdminPage } from "./AdminPage";
import { AdminOperationsPage } from "./AdminOperationsPage";
import { ToastProvider } from "@/components/composites/ToastProvider";
import * as dashboardService from "@/services/dashboardService";

vi.mock("@/services/dashboardService", async (importOriginal) => {
  const actual = await importOriginal<typeof dashboardService>();
  return {
    ...actual,
    fetchAdminAnalytics: vi.fn(),
    fetchPlatformHealth: vi.fn(),
    fetchAdminAuditLogs: vi.fn(),
  };
});

vi.mock("@/hooks/usePageTitle", () => ({
  usePageTitle: vi.fn(),
}));

// Mock ResizeObserver for Recharts ResponsiveContainer in JSDOM
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

const mockAnalyticsData: dashboardService.AdminAnalyticsData = {
  metrics: {
    activeLearners: 342,
    totalStudents: 1250,
    mentorNetwork: 48,
    xpEarned30d: 48500,
    sessionFillRate: 92,
  },
  topMentors: [
    { fullName: "Dr. Henok Tesfaye", mentorScore: 99.4, totalSessions: 48 },
    { fullName: "Bethlehem Alemu", mentorScore: 98.1, totalSessions: 39 },
  ],
  xpByTrack: [
    { title: "Frontend & Web3", category: "Web", xpTotal: 18400 },
    { title: "Backend & Cloud", category: "Cloud", xpTotal: 14200 },
    { title: "AI & Machine Learning", category: "AI", xpTotal: 10900 },
    { title: "Mobile Development", category: "Mobile", xpTotal: 5000 },
  ],
  upcomingSessions: [
    { title: "Go Microservices & Kafka", scheduledAt: "2026-09-01T14:00:00Z", status: "scheduled" },
    { title: "React 19 Server Actions", scheduledAt: "2026-09-02T16:00:00Z", status: "live" },
  ],
};

const mockPlatformHealthData: dashboardService.PlatformHealthData = {
  live: {
    status: "OK",
    mission: "Building Ethiopia's tech future",
    version: "v1",
    timestamp: "2026-08-29T18:54:00Z",
  },
  ready: {
    status: "ready",
    database: "connected",
    timestamp: "2026-08-29T18:54:00Z",
  },
  realtime: {
    status: "OK",
    rooms: 8,
    activeSockets: 64,
    uptimeSeconds: 36000,
    timestamp: "2026-08-29T18:54:00Z",
  },
};

const mockAuditLogs: dashboardService.AdminAuditLog[] = [
  {
    _id: "log-101",
    action: "APPROVE_MENTOR_APPLICATION",
    resource: "MentorApplication",
    resourceId: "app-101",
    actor: { fullName: "Admin System", email: "admin@ethiotech.org", role: "admin" },
    metadata: { method: "PATCH", path: "/api/v1/admin/mentors/app-101/approve", reason: "Verified credentials" },
    ip: "196.188.42.10",
    createdAt: "2026-08-29T18:50:00Z",
  },
  {
    _id: "log-102",
    action: "FLAG_SUBMISSION",
    resource: "Submission",
    resourceId: "sub-202",
    actor: { fullName: "Dr. Henok Tesfaye", email: "henok@ethiotech.org", role: "mentor" },
    metadata: { method: "POST", path: "/api/v1/admin/moderation/flag", reason: "Plagiarism test failure" },
    ip: "104.28.214.88",
    createdAt: "2026-08-29T18:40:00Z",
  },
];

const renderWithProviders = (component: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
    },
  });

  return render(
    <MemoryRouter>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>{component}</ToastProvider>
      </QueryClientProvider>
    </MemoryRouter>
  );
};

describe("AdminPage Component Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(dashboardService.fetchAdminAnalytics).mockResolvedValue(mockAnalyticsData);
  });

  it("renders platform overview hero and polished KPI StatCards", async () => {
    renderWithProviders(<AdminPage />);

    expect(await screen.findByText("Platform Analytics & Growth")).toBeTruthy();
    expect(screen.getByText("Active Learners")).toBeTruthy();
    expect(screen.getByText("Total Students")).toBeTruthy();
    expect(screen.getByText("Diaspora Mentors")).toBeTruthy();
    expect(screen.getByText("30d XP Velocity")).toBeTruthy();

    // Verify calculated metric values
    expect(screen.getByText("342")).toBeTruthy();
    expect(screen.getByText("1,250")).toBeTruthy();
    expect(screen.getByText("48")).toBeTruthy();
    expect(screen.getByText("48,500 XP")).toBeTruthy();
  });

  it("toggles XP growth chart view between weekly volume and cumulative", async () => {
    renderWithProviders(<AdminPage />);

    const cumulativeBtn = await screen.findByRole("button", { name: /cumulative/i });
    expect(cumulativeBtn).toBeTruthy();

    fireEvent.click(cumulativeBtn);
    expect(screen.getByText(/cumulative 30-day xp trajectory/i)).toBeTruthy();

    const weeklyBtn = screen.getByRole("button", { name: /weekly volume/i });
    fireEvent.click(weeklyBtn);
    expect(screen.getByText(/weekly xp earned velocity/i)).toBeTruthy();
  });

  it("renders top mentors leaderboard and track performance matrix", async () => {
    renderWithProviders(<AdminPage />);

    expect(await screen.findByText("Dr. Henok Tesfaye")).toBeTruthy();
    expect(screen.getByText("Bethlehem Alemu")).toBeTruthy();
    expect(screen.getByText("Track Performance & XP Distribution")).toBeTruthy();
    expect(screen.getByText("Frontend & Web3")).toBeTruthy();
  });

  it("renders regional hub hardware capacity", async () => {
    renderWithProviders(<AdminPage />);

    expect(await screen.findByText("Regional Hub Capacity & Hardware")).toBeTruthy();
    expect(screen.getByText("Addis Ababa Hub")).toBeTruthy();
  });
});

describe("AdminOperationsPage Component Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(dashboardService.fetchPlatformHealth).mockResolvedValue(mockPlatformHealthData);
    vi.mocked(dashboardService.fetchAdminAuditLogs).mockResolvedValue({ logs: mockAuditLogs });
  });

  it("renders operations center header and all 5 microservices in the health grid", async () => {
    renderWithProviders(<AdminOperationsPage />);

    expect(await screen.findByText("Platform Operations Center")).toBeTruthy();
    expect(screen.getByText("All Systems Operational")).toBeTruthy();

    // Microservices (rendered after healthQuery resolves)
    expect(await screen.findByText("LiveKit WebRTC SFU Server")).toBeTruthy();
    expect(screen.getByText("MongoDB Atlas Primary Cluster")).toBeTruthy();
    expect(screen.getByText("Socket.IO Gateway Cluster")).toBeTruthy();
    expect(screen.getByText("Cloud Storage & Global CDN")).toBeTruthy();
    expect(screen.getByText("Redis In-Memory Key-Value Cache")).toBeTruthy();
  });

  it("renders live resource telemetry meters", async () => {
    renderWithProviders(<AdminOperationsPage />);

    expect(await screen.findByText("Live Resource Telemetry")).toBeTruthy();
    expect(screen.getByText("Memory Allocation")).toBeTruthy();
    expect(screen.getByText("API Latency (p99)")).toBeTruthy();
    expect(screen.getByText("Socket Concurrency")).toBeTruthy();
    expect(screen.getByText("Security Shield")).toBeTruthy();
  });

  it("renders security audit stream and filters by search query", async () => {
    renderWithProviders(<AdminOperationsPage />);

    expect(await screen.findByText("Privileged Security Audit Stream")).toBeTruthy();
    expect(await screen.findByText("APPROVE_MENTOR_APPLICATION")).toBeTruthy();
    expect(screen.getByText("FLAG_SUBMISSION")).toBeTruthy();

    // Search filter
    const searchInput = screen.getByPlaceholderText(/search action, actor, resource ID, or IP/i);
    fireEvent.change(searchInput, { target: { value: "Henok" } });

    await waitFor(() => {
      expect(screen.getByText("FLAG_SUBMISSION")).toBeTruthy();
      expect(screen.queryByText("APPROVE_MENTOR_APPLICATION")).toBeNull();
    });
  });

  it("expands JSON payload metadata inspector on click", async () => {
    renderWithProviders(<AdminOperationsPage />);

    const inspectButtons = await screen.findAllByRole("button", { name: /inspect/i });
    expect(inspectButtons.length).toBeGreaterThan(0);

    fireEvent.click(inspectButtons[0]);
    expect(await screen.findByText(/Payload Metadata Snapshot/i)).toBeTruthy();
  });

  it("executes diagnostic quick action buttons", async () => {
    renderWithProviders(<AdminOperationsPage />);

    const sfuBtn = await screen.findByRole("button", { name: /test livekit sfu/i });
    fireEvent.click(sfuBtn);

    const dbBtn = screen.getByRole("button", { name: /ping database pool/i });
    fireEvent.click(dbBtn);

    const purgeBtn = screen.getByRole("button", { name: /flush cdn & cache/i });
    fireEvent.click(purgeBtn);
  });
});
