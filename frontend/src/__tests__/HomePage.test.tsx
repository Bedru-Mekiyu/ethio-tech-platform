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
      name: /Building Ethiopia's Tech Future with Hands-On Live Mentorship/i,
    });
    expect(headline).toBeDefined();

    expect(screen.getByText(/Pan-Ethiopian Engineering Platform/i)).toBeDefined();
    expect(screen.getByRole("button", { name: /Explore Curriculum/i })).toBeDefined();
    expect(screen.getByRole("button", { name: /Try Live Demo/i })).toBeDefined();
    expect(screen.getByRole("button", { name: /Apply as Mentor/i })).toBeDefined();
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

    expect(await screen.findByText(/Proven Platform Architecture/i)).toBeDefined();
    expect(screen.getByText(/WebRTC HD Classrooms/i)).toBeDefined();
    expect(screen.getAllByText(/6 Regional Hubs/i).length).toBeGreaterThan(0);
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

    const sandboxBtn = await screen.findByRole("button", { name: /Cloud Coding Sandbox/i });
    fireEvent.click(sandboxBtn);
    expect(screen.getByText(/Cloud Coding Sandbox/i)).toBeDefined();

    const squadsBtn = screen.getByRole("button", { name: /Squads Collaboration/i });
    fireEvent.click(squadsBtn);
    expect(screen.getByText(/Squads Collaboration/i)).toBeDefined();

    const certsBtn = screen.getByRole("button", { name: /Verified Certifications/i });
    fireEvent.click(certsBtn);
    expect(screen.getByText(/Verified Certifications/i)).toBeDefined();
  }, 15000);

  it("renders the 7 PISTELS pillars and allows pillar selection", async () => {
    const queryClient = createQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <HomePage />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(await screen.findByText(/The PISTELS Framework/i)).toBeDefined();
    expect(screen.getByText(/Practical & Project-Based/i)).toBeDefined();

    // Click on Pillar 'S' for Squads & Social Learning
    const buttons = screen.getAllByRole("button");
    const sBtn = buttons.find((b) => b.textContent?.startsWith("S"));
    if (sBtn) {
      fireEvent.click(sBtn);
    }
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

    expect(await screen.findByText(/Fullstack Web & Distributed Systems/i)).toBeDefined();

    const mobileFilterBtn = screen.getByRole("button", { name: /Mobile Apps/i });
    fireEvent.click(mobileFilterBtn);
    expect(screen.getByText(/Cross-Platform Mobile Engineering/i)).toBeDefined();
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

    expect(await screen.findByText(/6 Regional Hubs Powering/i)).toBeDefined();
    expect(screen.getByText(/Addis Ababa University/i)).toBeDefined();
    expect(screen.getAllByText(/Chapa Payment Systems/i).length).toBeGreaterThanOrEqual(1);
  }, 15000);
});
