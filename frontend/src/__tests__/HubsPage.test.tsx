import { describe, expect, it, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HubsPage } from "@/pages/marketing/HubsPage";
import { ToastProvider } from "@/components/composites/ToastProvider";

const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

describe("HubsPage Component Suite", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("renders the 6-hub explorer and Ethiopian regional tech network headline", async () => {
    const queryClient = createQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <MemoryRouter>
            <HubsPage />
          </MemoryRouter>
        </ToastProvider>
      </QueryClientProvider>
    );

    expect(await screen.findByText(/Physical Tech Hubs/i)).toBeDefined();
    expect(screen.getByText(/Across Ethiopia/i)).toBeDefined();
    expect((await screen.findAllByText(/Regional Hubs/i)).length).toBeGreaterThan(0);
    expect((await screen.findAllByText(/Addis Ababa/i)).length).toBeGreaterThan(0);
    expect((await screen.findAllByText(/Hawassa/i)).length).toBeGreaterThan(0);
    expect((await screen.findAllByText(/Bahir Dar/i)).length).toBeGreaterThan(0);
    expect((await screen.findAllByText(/Dire Dawa/i)).length).toBeGreaterThan(0);
    expect((await screen.findAllByText(/Mekelle/i)).length).toBeGreaterThan(0);
    expect((await screen.findAllByText(/Jimma/i)).length).toBeGreaterThan(0);
  });

  it("filters the regional hubs when clicking a city pill button", async () => {
    const queryClient = createQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <MemoryRouter>
            <HubsPage />
          </MemoryRouter>
        </ToastProvider>
      </QueryClientProvider>
    );

    const hawassaFilter = await screen.findByRole("button", { name: "Hawassa" });
    fireEvent.click(hawassaFilter);

    expect((await screen.findAllByText(/Sidama Region/i)).length).toBeGreaterThan(0);
    expect((await screen.findAllByText(/Selamawit Girma/i)).length).toBeGreaterThan(0);
  });

  it("opens booking modal, fills details, and confirms pass with QR code and +50 XP check-in", async () => {
    const queryClient = createQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <MemoryRouter>
            <HubsPage />
          </MemoryRouter>
        </ToastProvider>
      </QueryClientProvider>
    );

    // Click "Book a Desk" on one of the cards
    const bookButtons = await screen.findAllByRole("button", { name: /Book a Desk/i });
    expect(bookButtons.length).toBeGreaterThan(0);
    fireEvent.click(bookButtons[0]);

    // Check modal opens
    expect(await screen.findByText(/Physical Seat & Mentor Booking/i)).toBeDefined();

    // Select Afternoon slot
    const afternoonSlot = screen.getByText(/Afternoon Session/i);
    fireEvent.click(afternoonSlot);

    // Select AI & ML Compute Rig workstation
    const gpuWs = screen.getByText(/AI & ML Compute Rig/i);
    fireEvent.click(gpuWs);

    // Enter name & email
    const nameInput = screen.getByPlaceholderText(/Henok Tadesse/i);
    fireEvent.change(nameInput, { target: { value: "Abebe Bikila" } });

    const emailInput = screen.getByPlaceholderText(/henok@example.com/i);
    fireEvent.change(emailInput, { target: { value: "abebe@ethiotech.org" } });

    // Submit form
    const submitBtn = screen.getByRole("button", { name: /Confirm Free Reservation/i });
    fireEvent.click(submitBtn);

    // Digital pass modal should appear
    await waitFor(() => {
      expect(screen.getByText(/Official Digital Hub Pass/i)).toBeDefined();
      expect(screen.getByText(/Pass Code/i)).toBeDefined();
      expect(screen.getByText(/Abebe Bikila/i)).toBeDefined();
    });

    // Verify Check-in action
    const checkInBtn = screen.getByRole("button", { name: /Confirm Arrival Check-In/i });
    fireEvent.click(checkInBtn);

    // Expect celebration / XP reward
    await waitFor(() => {
      expect(screen.getByText(/Check-In Complete!/i)).toBeDefined();
      expect(screen.getByText(/\+50 XP Awarded to your profile/i)).toBeDefined();
    });
  });

  it("navigates to My Active Passes tab and performs arrival verification", async () => {
    const queryClient = createQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <MemoryRouter>
            <HubsPage />
          </MemoryRouter>
        </ToastProvider>
      </QueryClientProvider>
    );

    const passesTab = await screen.findByRole("button", { name: /Digital Hub Passes/i });
    fireEvent.click(passesTab);

    expect(screen.getByText(/Digital Hub Passes & Physical Check-In/i)).toBeDefined();
    expect(screen.getByPlaceholderText(/ETH-ADD-8392/i)).toBeDefined();

    // Perform check in with a pass code
    const codeInput = screen.getByPlaceholderText(/ETH-ADD-8392/i);
    fireEvent.change(codeInput, { target: { value: "ETH-ADD-9999" } });

    const checkInBtn = screen.getByRole("button", { name: /Check In \(\+50 XP\)/i });
    fireEvent.click(checkInBtn);

    await waitFor(() => {
      expect(screen.getByText(/Check-In Complete!/i)).toBeDefined();
      expect(screen.getByText(/\+50 XP Awarded to your profile/i)).toBeDefined();
    });
  });
});
