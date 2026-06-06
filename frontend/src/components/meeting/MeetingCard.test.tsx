import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import React from "react";
import { MeetingCard } from "./MeetingCard";
import type { MeetingViewModel } from "@/lib/realtime";

const baseMeeting: MeetingViewModel = {
  id: "s1",
  sessionId: "s1",
  title: "Algebra deep-dive",
  mentorId: "m1",
  mentorName: "Mentor One",
  mentorAvatar: null,
  studentId: "st1",
  studentName: "Student One",
  scheduledAt: "2026-06-06T12:00:00Z",
  durationMinutes: 60,
  status: "scheduled",
  hostJoined: false,
  presenceCount: 0,
  startsInMs: 30 * 60_000,
  endsAt: "2026-06-06T13:00:00Z",
  liveRoomId: null,
  classroomMode: "immersive-3d",
  liveProvider: "jitsi",
  joinable: false,
  isHost: false,
  isAdmin: false,
  isParticipant: true,
  joinHref: "/app/classroom/s1",
};

const renderCard = (props: Partial<React.ComponentProps<typeof MeetingCard>> = {}) =>
  render(
    <MemoryRouter>
      <MeetingCard meeting={baseMeeting} variant="full" {...props} />
    </MemoryRouter>,
  );

describe("MeetingCard", () => {
  it("renders scheduled status with start countdown", () => {
    renderCard();
    expect(screen.getByText("Scheduled")).toBeTruthy();
    expect(screen.getByText("Starts in 30 min")).toBeTruthy();
  });

  it("shows join button when meeting is active and joinable", () => {
    renderCard({ meeting: { ...baseMeeting, status: "active", joinable: true, hostJoined: true } });
    const join = screen.getByTestId("meeting-join");
    expect(join).toBeTruthy();
    expect(join.textContent).toContain("Join live session");
  });

  it("shows start button for host when status is scheduled", () => {
    renderCard({ meeting: { ...baseMeeting, isHost: true, joinable: true } });
    const start = screen.getByTestId("meeting-start");
    expect(start).toBeTruthy();
    expect(start.textContent).toContain("Start session");
  });

  it("fires onStart callback when start button is clicked", () => {
    const onStart = vi.fn();
    renderCard({ meeting: { ...baseMeeting, isHost: true, joinable: true }, onStart });
    fireEvent.click(screen.getByTestId("meeting-start"));
    expect(onStart).toHaveBeenCalledWith(expect.objectContaining({ id: "s1" }));
  });

  it("shows end button for host when meeting is active", () => {
    renderCard({ meeting: { ...baseMeeting, isHost: true, status: "active", hostJoined: true, joinable: true } });
    expect(screen.getByTestId("meeting-end")).toBeTruthy();
  });

  it("shows cancel button for host in scheduled or waiting_for_host state", () => {
    renderCard({ meeting: { ...baseMeeting, isHost: true, joinable: true } });
    expect(screen.getByTestId("meeting-cancel")).toBeTruthy();
  });

  it("does not show cancel button when meeting is active", () => {
    renderCard({ meeting: { ...baseMeeting, isHost: true, status: "active", hostJoined: true, joinable: true } });
    expect(screen.queryByTestId("meeting-cancel")).toBeNull();
  });

  it("renders waiting_for_host status and copy", () => {
    renderCard({ meeting: { ...baseMeeting, status: "waiting_for_host" } });
    expect(screen.getByText("Waiting for host")).toBeTruthy();
    expect(screen.getByText("Waiting for mentor to start the session")).toBeTruthy();
  });

  it("renders completed status and hides action buttons", () => {
    renderCard({ meeting: { ...baseMeeting, status: "completed", isHost: true, joinable: true } });
    expect(screen.getByText("Ended")).toBeTruthy();
    expect(screen.getByText("Unavailable")).toBeTruthy();
    expect(screen.queryByTestId("meeting-start")).toBeNull();
    expect(screen.queryByTestId("meeting-end")).toBeNull();
  });

  it("renders cancelled status with no action buttons", () => {
    renderCard({ meeting: { ...baseMeeting, status: "cancelled", isHost: true, joinable: true } });
    expect(screen.getByText("Cancelled")).toBeTruthy();
    expect(screen.queryByTestId("meeting-start")).toBeNull();
  });

  it("shows presence count when active and presence > 0", () => {
    renderCard({ meeting: { ...baseMeeting, status: "active", hostJoined: true, presenceCount: 3, joinable: true } });
    expect(screen.getByText("3")).toBeTruthy();
  });

  it("compact variant hides subtitle and date row", () => {
    renderCard({ variant: "compact", meeting: { ...baseMeeting, status: "active", hostJoined: true, joinable: true } });
    expect(screen.queryByText(/min$/)).toBeNull();
  });

  it("inline variant renders title with smaller font", () => {
    const { container } = renderCard({ variant: "inline" });
    const h3 = container.querySelector("h3");
    expect(h3?.className).toContain("text-sm");
  });
});
