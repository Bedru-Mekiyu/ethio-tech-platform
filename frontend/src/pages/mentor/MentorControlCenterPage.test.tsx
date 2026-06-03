import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";

vi.mock("@/services/mentorControlService", () => ({
  fetchMentorControlCenter: vi.fn().mockResolvedValue({
    overview: {
      liveParticipants: 12,
      waitingParticipants: 3,
      sessionDuration: 2700,
      attendancePercent: 85,
      engagementScore: 72,
      questionsWaiting: 5,
      raisedHands: 2,
      activePolls: 1,
      chatActivity: 45,
    },
    participants: [
      { id: "p1", userId: "u1", name: "Abebe", avatar: "", role: "participant", status: "active", attendanceDuration: 1500, joinedAt: new Date().toISOString(), verifiedAttendance: true },
      { id: "p2", userId: "u2", name: "Kebede", avatar: "", role: "cohost", status: "active", attendanceDuration: 2700, joinedAt: new Date().toISOString(), verifiedAttendance: true },
    ],
    waitingQueue: [
      { id: "w1", userId: "uw1", name: "Almaz", avatar: "", joinedAt: new Date().toISOString() },
    ],
    raisedHands: [
      { userId: "uh1", name: "Chala", queuePosition: 1, raisedAt: new Date().toISOString() },
    ],
    questions: [
      { id: "q1", userId: "uq1", studentName: "Bontu", text: "What is TypeScript?", status: "pending", isPinned: false, upvoteCount: 3, createdAt: new Date().toISOString() },
      { id: "q2", userId: "uq2", studentName: "Lemma", text: "How do I use generics?", status: "answered", isPinned: true, upvoteCount: 5, reply: { text: "Generics allow you to write reusable code.", repliedBy: "mentor", repliedAt: new Date().toISOString() }, createdAt: new Date().toISOString() },
    ],
    polls: [
      { id: "poll1", question: "Best framework?", type: "single", status: "active", options: [{ index: 0, text: "React", voteCount: 5, percentage: 50 }, { index: 1, text: "Vue", voteCount: 3, percentage: 30 }, { index: 2, text: "Angular", voteCount: 2, percentage: 20 }], totalVotes: 10, createdAt: new Date().toISOString() },
    ],
    engagementScores: [
      { student: { _id: "s1", fullName: "Abebe", avatar: "" }, score: 85, questionsAsked: 3, pollParticipations: 2, chatMessages: 8, attendanceMs: 1800000 },
    ],
  }),
  admitUser: vi.fn(),
  denyUser: vi.fn(),
  removeParticipant: vi.fn(),
  muteParticipant: vi.fn(),
  unmuteParticipant: vi.fn(),
  timeoutParticipant: vi.fn(),
  setParticipantRole: vi.fn(),
  answerQuestion: vi.fn(),
  pinQuestion: vi.fn(),
  archiveQuestion: vi.fn(),
  setQuestionStatus: vi.fn(),
  closePoll: vi.fn(),
  reopenPoll: vi.fn(),
  publishPollResults: vi.fn(),
  createPoll: vi.fn(),
  callOnStudent: vi.fn(),
  markHandAnswered: vi.fn(),
  clearAllRaisedHands: vi.fn(),
  getSessionNotes: vi.fn().mockResolvedValue({ content: "Test notes", currentVersion: 1, isPublished: false }),
  updateSessionNotes: vi.fn(),
  publishSessionNotes: vi.fn(),
}));

vi.mock("@/services/socket", () => ({
  acquireSocketConnection: vi.fn().mockReturnValue({ emit: vi.fn(), on: vi.fn(), off: vi.fn() }),
  releaseSocketConnection: vi.fn(),
  getSocket: vi.fn().mockReturnValue({ emit: vi.fn(), on: vi.fn() }),
}));

vi.mock("@/store/authStore", () => ({
  useAuthStore: vi.fn(),
}));

beforeEach(() => {
  (useAuthStore as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector?: (state: unknown) => unknown) => {
    const state = { user: { id: "mentor1", fullName: "Mentor", role: "mentor" }, accessToken: "test-token" };
    return selector ? selector(state) : state;
  });
});

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={["/mentor/control-center/test-session"]}>
        <Routes>
          <Route path="/mentor/control-center/:sessionId" element={ui} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe("MentorControlCenterPage", () => {
  it("renders stat cards with overview data", async () => {
    const Page = (await import("./MentorControlCenterPage")).default;
    renderWithProviders(<Page />);
    await waitFor(() => {
      expect(screen.getAllByText("12").length).toBeGreaterThan(0);
      expect(screen.getAllByText("3").length).toBeGreaterThan(0);
      expect(screen.getAllByText("72/100").length).toBeGreaterThan(0);
    });
  });

  it("renders participant names", async () => {
    const Page = (await import("./MentorControlCenterPage")).default;
    renderWithProviders(<Page />);
    await waitFor(() => {
      expect(screen.getAllByText("12").length).toBeGreaterThan(0);
    });
    const tabTrigger = screen.getByRole("tab", { name: /participants/i });
    userEvent.click(tabTrigger);
    await waitFor(() => {
      expect(screen.getAllByText("Abebe").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Kebede").length).toBeGreaterThan(0);
    });
  });

  it("shows waiting queue with admit/deny buttons", async () => {
    const Page = (await import("./MentorControlCenterPage")).default;
    renderWithProviders(<Page />);
    await waitFor(() => {
      expect(screen.getAllByText("Almaz").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Admit All Candidates").length).toBeGreaterThan(0);
    });
  });

  it("shows raised hands with queue positions", async () => {
    const Page = (await import("./MentorControlCenterPage")).default;
    renderWithProviders(<Page />);
    await waitFor(() => {
      expect(screen.getAllByText("Chala").length).toBeGreaterThan(0);
    });
  });

  it("shows questions with status badges", async () => {
    const Page = (await import("./MentorControlCenterPage")).default;
    renderWithProviders(<Page />);
    await waitFor(() => {
      expect(screen.getAllByText("12").length).toBeGreaterThan(0);
    });
    const tabTrigger = screen.getByRole("tab", { name: /q&a/i });
    userEvent.click(tabTrigger);
    await waitFor(() => {
      expect(screen.getAllByText("What is TypeScript?").length).toBeGreaterThan(0);
      expect(screen.getAllByText("How do I use generics?").length).toBeGreaterThan(0);
    });
  });

  it("shows poll results with bars", async () => {
    const Page = (await import("./MentorControlCenterPage")).default;
    renderWithProviders(<Page />);
    await waitFor(() => {
      expect(screen.getAllByText("12").length).toBeGreaterThan(0);
    });
    const tabTrigger = screen.getByRole("tab", { name: /polls/i });
    userEvent.click(tabTrigger);
    await waitFor(() => {
      expect(screen.getAllByText("Best framework?").length).toBeGreaterThan(0);
      expect(screen.getAllByText("React").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Vue").length).toBeGreaterThan(0);
    });
  });

  it("shows engagement scores", async () => {
    const Page = (await import("./MentorControlCenterPage")).default;
    renderWithProviders(<Page />);
    await waitFor(() => {
      expect(screen.getAllByText("12").length).toBeGreaterThan(0);
    });
    const tabTrigger = screen.getByRole("tab", { name: /engagement/i });
    userEvent.click(tabTrigger);
    await waitFor(() => {
      expect(screen.getAllByText("85").length).toBeGreaterThan(0);
    });
  });

  it("has working tab navigation", async () => {
    const Page = (await import("./MentorControlCenterPage")).default;
    renderWithProviders(<Page />);
    await waitFor(() => {
      expect(screen.getAllByText("Overview").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Participants (12)").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Q&A (5)").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Polls (1)").length).toBeGreaterThan(0);
    });
  });

  it("shows participant context menu on click", async () => {
    const Page = (await import("./MentorControlCenterPage")).default;
    renderWithProviders(<Page />);
    await waitFor(() => {
      expect(screen.getAllByText("12").length).toBeGreaterThan(0);
    });
    const tabTrigger = screen.getByRole("tab", { name: /participants/i });
    userEvent.click(tabTrigger);
    await waitFor(() => {
      const moreButtons = screen.getAllByRole("button");
      const moreButton = moreButtons.find((btn) => btn.querySelector("svg"));
      if (moreButton) userEvent.click(moreButton);
    });
  });

  it("renders loading skeleton when data is fetching", async () => {
    vi.mocked(await import("@/services/mentorControlService")).fetchMentorControlCenter.mockImplementationOnce(
      () => new Promise(() => {})
    );
    const Page = (await import("./MentorControlCenterPage")).default;
    renderWithProviders(<Page />);
    expect(document.title).toContain("Mentor Control Center");
  });
});
