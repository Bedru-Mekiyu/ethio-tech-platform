import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AdminContentPage } from "./AdminContentPage";
import { ToastProvider } from "@/components/composites/ToastProvider";
import { api } from "@/services/api";

vi.mock("@/services/api", () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock("@/hooks/usePageTitle", () => ({
  usePageTitle: vi.fn(),
}));

const mockTracks = [
  {
    _id: "track-1",
    title: "Fullstack Web Development",
    description: "Modern fullstack web engineering with TypeScript and React.",
    category: "web",
    isActive: true,
    xpReward: 600,
    estimatedWeeks: 14,
    modules: [{ _id: "mod-1", title: "React Fundamentals", lessons: [{ _id: "les-1" }] }],
  },
  {
    _id: "track-2",
    title: "Data Science & AI",
    description: "Machine learning, neural networks, and Python telemetry.",
    category: "ai",
    isActive: false,
    xpReward: 750,
    estimatedWeeks: 16,
    modules: [],
  },
];

const mockModules = [
  {
    _id: "mod-1",
    title: "React Fundamentals",
    description: "Component architecture and state primitives",
    track: "track-1",
    order: 1,
  },
  {
    _id: "mod-2",
    title: "Server & API Integration",
    description: "Node.js and GraphQL pipelines",
    track: "track-1",
    order: 2,
  },
];

const mockLessons = [
  {
    _id: "les-1",
    title: "JSX and Props Mastery",
    summary: "Understand unidirectional data flow",
    content: "# Intro to JSX\n\nJSX is syntactic sugar for React.createElement.",
    type: "concept" as const,
    durationMinutes: 15,
    xpReward: 40,
    module: "mod-1",
    order: 1,
  },
];

const mockProjects = [
  {
    _id: "proj-1",
    title: "Fintech Banking App",
    description: "Complete Ethiopian banking dashboard",
    track: "track-1",
    difficulty: "medium" as const,
    xpReward: 500,
    githubTemplate: "https://github.com/ethio/fintech",
    requirements: ["Implement OTP verification", "Add transaction history"],
  },
];

const renderAdminContentPage = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: Infinity,
      },
    },
  });

  return render(
    <MemoryRouter>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <AdminContentPage />
        </ToastProvider>
      </QueryClientProvider>
    </MemoryRouter>,
  );
};

describe("AdminContentPage Master-Detail CMS", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    (api.get as import("vitest").Mock).mockImplementation((url: string) => {
      if (url.startsWith("/tracks")) {
        return Promise.resolve({ data: { tracks: mockTracks } });
      }
      if (url.startsWith("/modules")) {
        return Promise.resolve({ data: { modules: mockModules } });
      }
      if (url.startsWith("/lessons")) {
        return Promise.resolve({ data: { lessons: mockLessons } });
      }
      if (url.startsWith("/projects")) {
        return Promise.resolve({ data: { items: mockProjects } });
      }
      return Promise.resolve({ data: {} });
    });

    (api.post as import("vitest").Mock).mockImplementation((_url: string, payload: unknown) =>
      Promise.resolve({ data: { data: { track: { _id: "new-t-1", ...payload } } } }),
    );
    (api.patch as import("vitest").Mock).mockResolvedValue({ data: { data: { success: true } } });
    (api.delete as import("vitest").Mock).mockResolvedValue({ data: { success: true } });
  });

  it("renders the 3-pane master-detail layout and track list", async () => {
    renderAdminContentPage();

    expect(screen.getByText("Curriculum Content Studio")).toBeTruthy();
    expect(screen.getByText("Curriculum Tracks")).toBeTruthy();

    expect(await screen.findByText("Fullstack Web Development")).toBeTruthy();
    expect(screen.getAllByText("Data Science & AI").length).toBeGreaterThan(0);
  });

  it("filters tracks by category pill", async () => {
    renderAdminContentPage();

    expect(await screen.findByText("Fullstack Web Development")).toBeTruthy();

    const aiPill = screen.getByRole("button", { name: /AI & ML/i });
    fireEvent.click(aiPill);

    expect(screen.getAllByText("Data Science & AI").length).toBeGreaterThan(0);
  });

  it("filters tracks by search bar query", async () => {
    renderAdminContentPage();

    expect(await screen.findByText("Fullstack Web Development")).toBeTruthy();

    const searchInput = screen.getByPlaceholderText("Search tracks...");
    fireEvent.change(searchInput, { target: { value: "telemetry" } });

    expect(screen.getAllByText("Data Science & AI").length).toBeGreaterThan(0);
  });

  it("loads track details in the editor pane when Editor tab is clicked", async () => {
    renderAdminContentPage();

    expect(await screen.findByRole("heading", { name: "Fullstack Web Development", level: 3 })).toBeTruthy();

    const editorTab = screen.getByRole("button", { name: "Editor" });
    fireEvent.click(editorTab);

    expect(await screen.findByText("Track Configuration")).toBeTruthy();
    const titleInput = screen.getByPlaceholderText(/e.g. Data Science & Machine Learning Engineering/i);
    expect((titleInput as HTMLInputElement).value).toBe("Fullstack Web Development");
  });

  it("allows switching to create a new track", async () => {
    renderAdminContentPage();

    expect(await screen.findByRole("heading", { name: "Fullstack Web Development", level: 3 })).toBeTruthy();

    const newTrackBtn = screen.getByRole("button", { name: /New Track/i });
    fireEvent.click(newTrackBtn);

    expect(await screen.findByText("Create New Track")).toBeTruthy();
  });
});
