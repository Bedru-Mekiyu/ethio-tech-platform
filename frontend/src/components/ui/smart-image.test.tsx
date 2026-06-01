import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SmartImage } from "./smart-image";

describe("SmartImage", () => {
  it("renders alt text for accessibility", () => {
    const html = renderToStaticMarkup(
      <SmartImage alt="Developer coding at night" />
    );
    expect(html).toContain("Developer coding at night");
  });

  it("renders loading attribute", () => {
    const html = renderToStaticMarkup(
      <SmartImage alt="Test image" />
    );
    expect(html).toContain('loading="lazy"');
  });

  it("renders srcSet when unsplashId provided", () => {
    const html = renderToStaticMarkup(
      <SmartImage unsplashId="photo-123" alt="Unsplash image" />
    );
    expect(html).toContain("srcSet");
    expect(html).toContain("images.unsplash.com");
  });

  it("renders decoding async attribute", () => {
    const html = renderToStaticMarkup(
      <SmartImage unsplashId="photo-123" alt="Optimized image" />
    );
    expect(html).toContain('decoding="async"');
  });
});
