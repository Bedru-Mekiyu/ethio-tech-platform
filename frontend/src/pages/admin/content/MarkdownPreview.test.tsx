import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MarkdownPreview } from "./MarkdownPreview";

describe("MarkdownPreview Component", () => {
  it("renders empty state when content is empty", () => {
    render(<MarkdownPreview content="" />);
    expect(screen.getByText(/No content written yet/i)).toBeTruthy();
  });

  it("renders headings properly", () => {
    const md = "# Heading 1\n## Heading 2\n### Heading 3";
    render(<MarkdownPreview content={md} />);
    expect(screen.getByText("Heading 1")).toBeTruthy();
    expect(screen.getByText("Heading 2")).toBeTruthy();
    expect(screen.getByText("Heading 3")).toBeTruthy();
  });

  it("renders code blocks with language tag", () => {
    const md = "```typescript\nconst greeting: string = 'Hello Addis Ababa';\n```";
    render(<MarkdownPreview content={md} />);
    expect(screen.getByText("typescript")).toBeTruthy();
    expect(screen.getByText("const greeting: string = 'Hello Addis Ababa';")).toBeTruthy();
  });

  it("renders GitHub style alert callouts", () => {
    const md = "> [!NOTE]\n> Ensure your MongoDB connection string is configured in .env";
    render(<MarkdownPreview content={md} />);
    expect(screen.getByText("Note")).toBeTruthy();
    expect(screen.getByText(/Ensure your MongoDB connection string/i)).toBeTruthy();
  });

  it("renders bullet and task lists", () => {
    const md = "- Regular item\n- [x] Completed task item\n- [ ] Pending task item";
    render(<MarkdownPreview content={md} />);
    expect(screen.getByText("Regular item")).toBeTruthy();
    expect(screen.getByText("Completed task item")).toBeTruthy();
    expect(screen.getByText("Pending task item")).toBeTruthy();
  });

  it("renders markdown tables", () => {
    const md = "| Module | Topics | XP |\n|---|---|---|\n| M1 | React Basics | 50 XP |";
    render(<MarkdownPreview content={md} />);
    expect(screen.getByText("Module")).toBeTruthy();
    expect(screen.getByText("React Basics")).toBeTruthy();
    expect(screen.getByText("50 XP")).toBeTruthy();
  });
});
