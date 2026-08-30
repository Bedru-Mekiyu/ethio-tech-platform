import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ContentEditorPane } from "./ContentEditorPane";
import type { Track, Module, Lesson } from "./types";

const mockTrack: Track = {
  _id: "t-1",
  title: "Cloud Native Engineering",
  description: "Kubernetes, Docker, and AWS Architecture",
  category: "cloud",
  isActive: true,
  xpReward: 800,
  estimatedWeeks: 12,
};

const mockModule: Module = {
  _id: "m-1",
  title: "Docker Fundamentals",
  description: "Containerization deep dive",
  track: "t-1",
  order: 1,
};

const mockLesson: Lesson = {
  _id: "l-1",
  title: "Container Networking",
  summary: "Bridge networks and overlay",
  content: "# Docker Networking\n\nBridge networks connect containers.",
  type: "concept",
  durationMinutes: 20,
  xpReward: 50,
  module: "m-1",
  order: 1,
};

describe("ContentEditorPane Component", () => {
  it("renders Create New Track form when selection is new-track", () => {
    const handleSaveTrack = vi.fn();
    render(
      <ContentEditorPane
        selection={{ type: "new-track" }}
        selectedTrack={null}
        selectedModule={null}
        selectedLesson={null}
        capstoneProjects={[]}
        onSaveTrack={handleSaveTrack}
        onSaveModule={vi.fn()}
        onSaveLesson={vi.fn()}
        onDeleteTrack={vi.fn()}
        onDeleteModule={vi.fn()}
        onDeleteLesson={vi.fn()}
        onSaveCapstoneProject={vi.fn()}
        onDeleteCapstoneProject={vi.fn()}
        isSaving={false}
      />
    );

    expect(screen.getByText("Create New Track")).toBeTruthy();
    expect(screen.getByPlaceholderText(/e.g. Data Science/i)).toBeTruthy();

    const titleInput = screen.getByPlaceholderText(/e.g. Data Science/i);
    fireEvent.change(titleInput, { target: { value: "AI Systems Engineering" } });

    const saveBtn = screen.getByRole("button", { name: /Save Changes/i });
    fireEvent.click(saveBtn);

    expect(handleSaveTrack).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "AI Systems Engineering",
      })
    );
  });

  it("renders Track Configuration when editing an existing track", () => {
    render(
      <ContentEditorPane
        selection={{ type: "track", trackId: "t-1" }}
        selectedTrack={mockTrack}
        selectedModule={null}
        selectedLesson={null}
        capstoneProjects={[]}
        onSaveTrack={vi.fn()}
        onSaveModule={vi.fn()}
        onSaveLesson={vi.fn()}
        onDeleteTrack={vi.fn()}
        onDeleteModule={vi.fn()}
        onDeleteLesson={vi.fn()}
        onSaveCapstoneProject={vi.fn()}
        onDeleteCapstoneProject={vi.fn()}
        isSaving={false}
      />
    );

    expect(screen.getByText("Track Configuration")).toBeTruthy();
    expect(screen.getByDisplayValue("Cloud Native Engineering")).toBeTruthy();
  });

  it("renders Lesson Editor with Markdown live preview and video URL", () => {
    render(
      <ContentEditorPane
        selection={{ type: "lesson", trackId: "t-1", moduleId: "m-1", lessonId: "l-1" }}
        selectedTrack={mockTrack}
        selectedModule={mockModule}
        selectedLesson={mockLesson}
        capstoneProjects={[]}
        onSaveTrack={vi.fn()}
        onSaveModule={vi.fn()}
        onSaveLesson={vi.fn()}
        onDeleteTrack={vi.fn()}
        onDeleteModule={vi.fn()}
        onDeleteLesson={vi.fn()}
        onSaveCapstoneProject={vi.fn()}
        onDeleteCapstoneProject={vi.fn()}
        isSaving={false}
      />
    );

    expect(screen.getByDisplayValue("Container Networking")).toBeTruthy();
    expect(screen.getByText("Lesson Delivery Type")).toBeTruthy();

    // Switch to Preview tab in Markdown editor
    const previewTab = screen.getByRole("button", { name: /Preview/i });
    fireEvent.click(previewTab);

    expect(screen.getByText("Docker Networking")).toBeTruthy();
  });
});
