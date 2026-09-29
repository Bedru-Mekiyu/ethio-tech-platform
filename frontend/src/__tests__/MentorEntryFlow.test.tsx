import { describe, expect, it } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MentorOnboardingStepper } from "@/components/mentor/MentorOnboardingStepper";
import { MentorRecruitmentPage } from "@/pages/marketing/MentorRecruitmentPage";
import { ActivateAccountPage } from "@/pages/auth/ActivateAccountPage";

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

describe("Mentor Entry Flow Suite", () => {
  describe("MentorOnboardingStepper", () => {
    const steps = [
      { id: "password", label: "Password", shortLabel: "Pass" },
      { id: "terms", label: "Code of Conduct", shortLabel: "Terms" },
      { id: "profile", label: "Profile Details", shortLabel: "Profile" },
      { id: "photo", label: "Photo Upload", shortLabel: "Photo" },
      { id: "availability", label: "Weekly Schedule", shortLabel: "Schedule" },
    ] as const;

    it("renders all 5 steps and correctly sets aria-current on active step", () => {
      render(<MentorOnboardingStepper steps={steps} activeStepId="profile" />);

      // Verify all steps are rendered
      expect(screen.getByText("Password")).toBeTruthy();
      expect(screen.getByText("Code of Conduct")).toBeTruthy();
      expect(screen.getByText("Profile Details")).toBeTruthy();
      expect(screen.getByText("Photo Upload")).toBeTruthy();
      expect(screen.getByText("Weekly Schedule")).toBeTruthy();

      // Verify active step has aria-current="step"
      const profileItem = screen.getByText("Profile Details").closest("li");
      expect(profileItem?.getAttribute("aria-current")).toBe("step");

      // Verify upcoming step does not have aria-current
      const photoItem = screen.getByText("Photo Upload").closest("li");
      expect(photoItem?.getAttribute("aria-current")).toBeNull();
    });
  });

  describe("MentorRecruitmentPage", () => {
    it("renders headline, value props, and all required form fields", () => {
      const queryClient = createTestQueryClient();
      render(
        <QueryClientProvider client={queryClient}>
          <MemoryRouter>
            <MentorRecruitmentPage />
          </MemoryRouter>
        </QueryClientProvider>,
      );

      // Verify headline
      expect(screen.getByText(/Guide Ethiopia's Emerging/i)).toBeTruthy();
      expect(screen.getByText(/Software Architects/i)).toBeTruthy();

      // Verify fields
      expect(screen.getByLabelText(/Full Name/i)).toBeTruthy();
      expect(screen.getByLabelText(/Email Address/i)).toBeTruthy();
      expect(screen.getByLabelText(/Current Professional Role/i)).toBeTruthy();
      expect(screen.getByLabelText(/Years of Professional Experience/i)).toBeTruthy();
      expect(screen.getByLabelText(/Why do you want to mentor with EthioTech\?/i)).toBeTruthy();

      // Verify domains
      expect(screen.getByRole("group", { name: "Technical Domains" })).toBeTruthy();
      expect(screen.getByText("Frontend (React / TypeScript)")).toBeTruthy();

      // Verify submit button
      expect(screen.getByRole("button", { name: /Submit Mentor Application/i })).toBeTruthy();
    });

    it("displays validation error when experience is less than 2 years", async () => {
      const queryClient = createTestQueryClient();
      render(
        <QueryClientProvider client={queryClient}>
          <MemoryRouter>
            <MentorRecruitmentPage />
          </MemoryRouter>
        </QueryClientProvider>,
      );

      // Set invalid years of experience (< 2)
      const expInput = screen.getByLabelText(/Years of Professional Experience/i);
      fireEvent.change(expInput, { target: { value: "1" } });

      // Fill in required fields
      fireEvent.change(screen.getByLabelText(/Full Name/i), { target: { value: "Abebe Bikila" } });
      fireEvent.change(screen.getByLabelText(/Email Address/i), { target: { value: "abebe@example.com" } });
      fireEvent.change(screen.getByLabelText(/Current Professional Role/i), { target: { value: "Junior Dev" } });
      fireEvent.change(screen.getByLabelText(/Why do you want to mentor/i), {
        target: { value: "I am passionate about mentoring student developers in Ethiopia." },
      });

      // Check consent
      const consentCheckbox = screen.getByRole("checkbox");
      fireEvent.click(consentCheckbox);

      // Submit
      const submitBtn = screen.getByRole("button", { name: /Submit Mentor Application/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(
          screen.getByText(/Mentorship requires at least 2 years of professional industry experience/i),
        ).toBeTruthy();
      });
    });
  });

  describe("ActivateAccountPage", () => {
    it("renders Missing Activation Token state when no token is in URL", () => {
      render(
        <MemoryRouter initialEntries={["/auth/activate"]}>
          <Routes>
            <Route path="/auth/activate" element={<ActivateAccountPage />} />
          </Routes>
        </MemoryRouter>,
      );

      expect(screen.getByText("Missing Activation Token")).toBeTruthy();
      expect(screen.getByRole("button", { name: "Sign In" })).toBeTruthy();
      expect(screen.getByRole("button", { name: "Contact Support" })).toBeTruthy();
    });

    it("renders password creation form when token query param is provided", () => {
      render(
        <MemoryRouter initialEntries={["/auth/activate?token=valid-test-token"]}>
          <Routes>
            <Route path="/auth/activate" element={<ActivateAccountPage />} />
          </Routes>
        </MemoryRouter>,
      );

      expect(screen.getByText("Activate Mentor Account")).toBeTruthy();
      expect(screen.getByLabelText(/^Permanent Password/i)).toBeTruthy();
      expect(screen.getByLabelText(/Confirm Permanent Password/i)).toBeTruthy();
      expect(screen.getByRole("button", { name: "Activate Account" })).toBeTruthy();
    });
  });
});
