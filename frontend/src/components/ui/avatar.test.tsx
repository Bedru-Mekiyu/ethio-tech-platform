import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Avatar } from "./avatar";
import { buildAvatarFallbackChain, getSystemAvatarById } from "@/config/avatarLibrary";

describe("avatar system", () => {
  it("renders a system avatar fallback with accessible initials placeholder", () => {
    const html = renderToStaticMarkup(<Avatar name="Aster Bekele" />);

    expect(html).toContain("/avatars/");
    expect(html).toContain("profile avatar");
    expect(html).toContain(">AB<");
  });

  it("builds a stable fallback chain", () => {
    const chain = buildAvatarFallbackChain("student-seed", "student");

    expect(chain).toHaveLength(4);
    expect(new Set(chain).size).toBe(chain.length);
    expect(chain[0]).toMatch(/^\/avatars\/student-/);
  });

  it("resolves known avatar ids", () => {
    expect(getSystemAvatarById("mentor-01")?.url).toBe("/avatars/mentor-01.svg");
  });

  it("handles undefined name and userId gracefully without throwing", () => {
    // Exact production failure condition: name and userId both undefined
    expect(() => renderToStaticMarkup(<Avatar />)).not.toThrow();
    const html = renderToStaticMarkup(<Avatar />);
    expect(html).toContain('role="img"');
    expect(html).toContain("Profile avatar");
  });

  it("safeguards buildAvatarFallbackChain against null, undefined, or empty seeds", () => {
    expect(() => buildAvatarFallbackChain(undefined)).not.toThrow();
    expect(() => buildAvatarFallbackChain(null as unknown as string)).not.toThrow();
    expect(() => buildAvatarFallbackChain("")).not.toThrow();

    const chainUndefined = buildAvatarFallbackChain(undefined);
    expect(chainUndefined.length).toBeGreaterThan(0);
    expect(chainUndefined[0]).toMatch(/^\/avatars\//);
  });
});
