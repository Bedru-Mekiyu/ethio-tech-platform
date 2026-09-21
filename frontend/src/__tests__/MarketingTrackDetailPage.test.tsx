import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { MarketingTrackDetailPage } from "@/pages/marketing/MarketingTrackDetailPage";

vi.mock("@/hooks/usePageTitle", () => ({
  usePageTitle: vi.fn(),
}));

describe("MarketingTrackDetailPage Component Test Suite", () => {
  it("renders track details when valid slug is provided in params", () => {
    render(
      <MemoryRouter initialEntries={["/tracks/fullstack-web"]}>
        <Routes>
          <Route path="/tracks/:trackId" element={<MarketingTrackDetailPage />} />
          <Route path="/tracks" element={<div>Tracks List Fallback</div>} />
        </Routes>
      </MemoryRouter>,
    );

    // Title & tagline
    expect(screen.getByRole("heading", { level: 1, name: /Fullstack Web Engineering/i })).toBeTruthy();
    expect(screen.getByText(/Build enterprise React frontends/i)).toBeTruthy();

    // Stats
    expect(screen.getByText(/14 weeks/i)).toBeTruthy();
    expect(screen.getByText(/24 live sessions/i)).toBeTruthy();
    expect(screen.getByText(/36h mentorship/i)).toBeTruthy();

    // Sections
    expect(screen.getByText(/Curriculum Modules/i)).toBeTruthy();
    expect(screen.getByText(/Market Demand/i)).toBeTruthy();
    expect(screen.getByText(/Tools & Technologies/i)).toBeTruthy();
    expect(screen.getByText(/Career Outcomes/i)).toBeTruthy();
    expect(screen.getByText(/Prerequisites/i)).toBeTruthy();

    // CTAs
    expect(screen.getByRole("button", { name: /Enroll in Track/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Browse All Tracks/i })).toBeTruthy();
  });

  it("redirects to /tracks when unknown track ID is provided", () => {
    render(
      <MemoryRouter initialEntries={["/tracks/non-existent-track-xyz"]}>
        <Routes>
          <Route path="/tracks/:trackId" element={<MarketingTrackDetailPage />} />
          <Route path="/tracks" element={<div>Tracks List Fallback</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("Tracks List Fallback")).toBeTruthy();
  });
});
