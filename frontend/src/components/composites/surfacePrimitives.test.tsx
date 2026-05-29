import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { EmptyState } from "./EmptyState";
import { QueryError } from "./QueryError";
import { RouteFallback } from "../layout/RouteFallback";

describe("shared surface primitives", () => {
  it("renders the route fallback copy", () => {
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <RouteFallback label="Loading classroom" />
      </MemoryRouter>
    );

    expect(html).toContain("Loading classroom");
    expect(html).toContain("Syncing secure platform data...");
    expect(html).toContain('role="status"');
  });

  it("renders the empty state action link", () => {
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <EmptyState
          title="No projects yet"
          description="Start your first build from the tracks area."
          actionLabel="Explore tracks"
          actionHref="/tracks"
        />
      </MemoryRouter>
    );

    expect(html).toContain("No projects yet");
    expect(html).toContain("Start your first build from the tracks area.");
    expect(html).toContain('href="/tracks"');
  });

  it("renders the query error affordance", () => {
    const html = renderToStaticMarkup(<QueryError message="Could not load data." onRetry={() => undefined} />);

    expect(html).toContain('role="alert"');
    expect(html).toContain("Could not load data.");
    expect(html).toContain("Try again");
  });
});
