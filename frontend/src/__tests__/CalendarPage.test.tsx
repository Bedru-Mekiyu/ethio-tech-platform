import { describe, expect, it, vi, beforeEach, beforeAll } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CalendarPage } from "@/pages/app/CalendarPage";
import * as calendarService from "@/services/calendarService";

beforeAll(() => {
  class MockIntersectionObserver implements IntersectionObserver {
    readonly root: Element | Document | null = null;
    readonly rootMargin: string = "";
    readonly thresholds: ReadonlyArray<number> = [];
    disconnect = vi.fn();
    observe = vi.fn();
    takeRecords = vi.fn(() => []);
    unobserve = vi.fn();
  }
  Object.defineProperty(window, "IntersectionObserver", {
    writable: true,
    configurable: true,
    value: MockIntersectionObserver,
  });
  Object.defineProperty(global, "IntersectionObserver", {
    writable: true,
    configurable: true,
    value: MockIntersectionObserver,
  });
});

const mockEvents: calendarService.CalendarEvent[] = [
  {
    _id: "evt-1",
    id: "evt-1",
    title: "Distributed Caching & Redis Architecture Sprint",
    description: "Deep dive into Redis cluster configurations and cache invalidation strategies.",
    type: "study_block",
    status: "pending",
    start: new Date().toISOString(),
    end: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    allDay: false,
    color: "#6366F1",
    targetTrack: "Fullstack Web Engineering",
    capstoneProject: "Distributed Banking Gateway",
  },
  {
    _id: "evt-2",
    id: "evt-2",
    title: "WebRTC Live Classroom with Senior Mentor",
    description: "Interactive peer code review and LiveKit streaming setup.",
    type: "session",
    status: "completed",
    sessionId: "sess-99",
    start: new Date().toISOString(),
    end: new Date(Date.now() + 1.5 * 60 * 60 * 1000).toISOString(),
    allDay: false,
    color: "#3B82F6",
    targetTrack: "Fullstack Web Engineering",
  },
  {
    _id: "evt-3",
    id: "evt-3",
    title: "PostgreSQL Migration & Prisma Schema Deadline",
    description: "Final submit before Friday mentor review cut.",
    type: "deadline",
    status: "pending",
    start: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    end: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(),
    allDay: false,
    color: "#EF4444",
    targetTrack: "Fullstack Web Engineering",
  },
  {
    _id: "evt-4",
    id: "evt-4",
    title: "Addis Ababa Tech Hub Co-Working Day",
    description: "In-person pairing at AAU 4 Kilo campus hub.",
    type: "hub_visit",
    status: "pending",
    start: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
    end: new Date(Date.now() + 52 * 60 * 60 * 1000).toISOString(),
    allDay: true,
    color: "#F59E0B",
  },
];

vi.mock("@/services/calendarService", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/services/calendarService")>();
  return {
    ...actual,
    fetchCalendarEvents: vi.fn(),
    createCalendarEvent: vi.fn(),
    updateCalendarEvent: vi.fn(),
    deleteCalendarEvent: vi.fn(),
    syncSessionsToCalendar: vi.fn(),
    downloadCalendarFile: vi.fn(),
  };
});

vi.mock("@/hooks/useMeetings", () => ({
  useMeetings: vi.fn().mockReturnValue({
    meetings: [
      {
        id: "sess-99",
        sessionId: "sess-99",
        title: "WebRTC Live Classroom with Senior Mentor",
        status: "upcoming",
      },
    ],
  }),
}));

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });

describe("CalendarPage Component Test Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(calendarService.fetchCalendarEvents).mockResolvedValue(mockEvents);
    vi.mocked(calendarService.createCalendarEvent).mockImplementation((payload) =>
      Promise.resolve({
        _id: `evt-${Date.now()}`,
        id: `evt-${Date.now()}`,
        title: payload.title,
        description: payload.description,
        type: payload.type,
        status: payload.status || "pending",
        start: payload.start,
        end: payload.end || payload.start,
        allDay: Boolean(payload.allDay),
        color: payload.color || "#6366F1",
        targetTrack: payload.targetTrack,
        capstoneProject: payload.capstoneProject,
      }),
    );
    vi.mocked(calendarService.updateCalendarEvent).mockImplementation((id, payload) =>
      Promise.resolve({
        _id: id,
        id,
        title: "Updated",
        type: "study_block",
        start: new Date().toISOString(),
        end: new Date().toISOString(),
        allDay: false,
        ...payload,
      }),
    );
    vi.mocked(calendarService.deleteCalendarEvent).mockResolvedValue({ success: true });
    vi.mocked(calendarService.syncSessionsToCalendar).mockResolvedValue(3);
  });

  it("renders the Study Planner & Calendar header and habit tracker sprint widget", async () => {
    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <CalendarPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(await screen.findByText(/Study Planner & Calendar/i)).toBeDefined();
    expect(screen.getByText(/Study Streak/i)).toBeDefined();
    expect(screen.getByText(/hrs completed/i)).toBeDefined();
    expect(screen.getByText(/Sync Sessions/i)).toBeDefined();
    expect(screen.getByText(/Export ICS/i)).toBeDefined();
    expect(screen.getAllByRole("button", { name: /Add Study Block/i }).length).toBeGreaterThan(0);
  });

  it("switches view modes between Month Grid, Week Sprint, and Study Agenda", async () => {
    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <CalendarPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    // Initial view is Month Grid
    expect(await screen.findByText("Month Grid")).toBeDefined();
    expect(screen.getByText("Day Agenda")).toBeDefined();

    // Switch to Week Sprint view
    const weekBtn = screen.getByRole("button", { name: /Week Sprint/i });
    fireEvent.click(weekBtn);
    expect(await screen.findAllByText(/Add Block/i)).toBeDefined();
    expect(screen.getAllByText(/Add Block/i).length).toBeGreaterThan(0);

    // Switch to Study Agenda view
    const agendaBtn = screen.getByRole("button", { name: /Study Agenda/i });
    fireEvent.click(agendaBtn);
    expect(await screen.findByPlaceholderText(/Search agenda by title, track.../i)).toBeDefined();
    expect(screen.getByText("Distributed Caching & Redis Architecture Sprint")).toBeDefined();
  });

  it("navigates dates forward, backward, and jumps to today", async () => {
    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <CalendarPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await screen.findByText(/Study Planner & Calendar/i);

    const prevBtn = screen.getByRole("button", { name: /Previous period/i });
    const nextBtn = screen.getByRole("button", { name: /Next period/i });
    const todayBtn = screen.getByRole("button", { name: /Jump to today/i });

    fireEvent.click(nextBtn);
    fireEvent.click(prevBtn);
    fireEvent.click(todayBtn);

    expect(screen.getByText(/Study Planner & Calendar/i)).toBeDefined();
  });

  it("filters events in Study Agenda view by search term and type", async () => {
    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <CalendarPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    // Switch to Study Agenda
    const agendaBtn = await screen.findByRole("button", { name: /Study Agenda/i });
    fireEvent.click(agendaBtn);

    const searchInput = screen.getByPlaceholderText(/Search agenda by title, track.../i);
    fireEvent.change(searchInput, { target: { value: "Redis" } });

    // Should find the Redis study block
    expect(screen.getByText(/Distributed Caching & Redis Architecture Sprint/i)).toBeDefined();

    // Should not show non-matching events
    expect(screen.queryByText(/PostgreSQL Migration/i)).toBeNull();

    // Clear search
    fireEvent.change(searchInput, { target: { value: "" } });
    expect(screen.getByText(/PostgreSQL Migration/i)).toBeDefined();
  });

  it("opens AddEventModal when clicking Schedule Block and handles event creation", async () => {
    const user = userEvent.setup();
    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <CalendarPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await screen.findByText(/Study Planner & Calendar/i);

    // Open add modal
    const addBtn = screen.getByRole("button", { name: /Schedule Block/i });
    fireEvent.click(addBtn);

    // Verify modal is open
    const dialog = await screen.findByRole("dialog");
    expect(dialog).toBeDefined();
    expect(within(dialog).getByText(/Schedule Event \/ Study Block/i)).toBeDefined();

    // Fill form
    const titleInput = within(dialog).getByPlaceholderText(/Distributed Caching & Redis Architecture Sprint/i);
    await user.type(titleInput, "Next.js App Router Architecture Sprint");

    const descInput = within(dialog).getByPlaceholderText(/What topics, code exercises, or deliverables/i);
    await user.type(descInput, "Mastering nested layouts, server actions, and optimistic updates.");

    // Submit form
    const submitBtn = dialog.querySelector('button[type="submit"]') as HTMLButtonElement;
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(calendarService.createCalendarEvent).toHaveBeenCalled();
    });
  });

  it("triggers sync sessions action and displays feedback", async () => {
    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <CalendarPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    const syncBtn = await screen.findByRole("button", { name: /Sync Sessions/i });
    fireEvent.click(syncBtn);

    await waitFor(() => {
      expect(calendarService.syncSessionsToCalendar).toHaveBeenCalled();
    });

    expect(await screen.findByText(/Synced 3 live sessions/i)).toBeDefined();
  });

  it("triggers calendar export ICS download", async () => {
    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <CalendarPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    const exportBtn = await screen.findByRole("button", { name: /Export ICS/i });
    fireEvent.click(exportBtn);

    await waitFor(() => {
      expect(calendarService.downloadCalendarFile).toHaveBeenCalled();
    });
  });
});
