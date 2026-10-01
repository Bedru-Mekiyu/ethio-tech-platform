import { describe, expect, it, vi, beforeAll } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HomePage } from "@/pages/marketing/HomePage";

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

vi.mock("@/services/marketingService", () => ({
  fetchMarketingHome: vi.fn().mockResolvedValue({
    stats: {
      activeLearners: 12500,
      mentorNetwork: 160,
      trackCount: 5,
      approvalRate: 94.2,
    },
    hero: {
      activeLearners: 12500,
      topLearnerXp: 9800,
      topMentorScore: 99,
      topMentorName: "Selamawit Tekle",
    },
    featuredTracks: [],
    featuredMentors: [],
    featuredLearners: [],
    compact: {
      activeLearners: "12.5k",
      mentorNetwork: "160",
      trackCount: "5",
    },
  }),
}));

const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

describe("HomePage Component Suite", () => {
  it("renders the hero headline and value proposition", async () => {
    const queryClient = createQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <HomePage />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    const headline = await screen.findByRole("heading", {
      name: /Learn From Engineers Shipping in Production Right Now/i,
    });
    expect(headline).toBeDefined();

    expect(screen.getByText(/Not instructors reading slides.*Senior engineers reviewing your code/i)).toBeDefined();
    expect(screen.getAllByRole("button", { name: /Explore 6 Engineering Tracks/i }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("button", { name: /Start Learning Free/i }).length).toBeGreaterThan(0);

    // Check for the platform badge
    expect(screen.getByText(/Tuition-Free Engineering Fellowship/i)).toBeDefined();
  }, 15000);

  it("renders the trust points and regional reach section", async () => {
    const queryClient = createQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <HomePage />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(await screen.findByText(/Core Learning Stack/i)).toBeDefined();
    expect(screen.getByText(/WebRTC Classrooms/i)).toBeDefined();
    expect(screen.getAllByText(/Regional Hubs/i).length).toBeGreaterThan(0);
  }, 15000);

  it("switches tabs in the platform feature showcase", async () => {
    const queryClient = createQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <HomePage />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    const sandboxBtn = await screen.findByRole("button", { name: /In-Browser Workspace/i });
    fireEvent.click(sandboxBtn);
    expect(screen.getAllByText(/In-Browser Workspace/i).length).toBeGreaterThan(0);

    const squadsBtn = screen.getByRole("button", { name: /Peer Squads/i });
    fireEvent.click(squadsBtn);
    expect(screen.getAllByText(/Peer Squads/i).length).toBeGreaterThan(0);

    const certsBtn = screen.getByRole("button", { name: /Certificates/i });
    fireEvent.click(certsBtn);
    expect(screen.getAllByText(/Certificates/i).length).toBeGreaterThan(0);
  }, 15000);

  it("renders the mentor network spotlight", async () => {
    const queryClient = createQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <HomePage />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(screen.getAllByText(/Engineering Mentors/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Learn Directly From/i)).toBeDefined();
    expect(screen.getAllByRole("button", { name: /Apply to Mentor/i }).length).toBeGreaterThan(0);
  }, 15000);

  it("filters the curriculum tracks", async () => {
    const queryClient = createQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <HomePage />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(await screen.findByText(/Fullstack Web Systems/i)).toBeDefined();

    const mobileFilterBtn = screen.getByRole("button", { name: /Mobile Apps/i });
    fireEvent.click(mobileFilterBtn);
    expect(screen.getByText(/Mobile App Engineering/i)).toBeDefined();
  }, 15000);

  it("renders the regional hubs and partner organizations", async () => {
    const queryClient = createQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <HomePage />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(await screen.findByText(/Six Regional Hubs Powering/i)).toBeDefined();
    expect(screen.getByText(/Addis Ababa University/i)).toBeDefined();
    expect(screen.getAllByText(/Chapa Payment Systems/i).length).toBeGreaterThanOrEqual(1);
  }, 15000);
});
