import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Avatar } from "./avatar";
import { buildAvatarFallbackChain, getSystemAvatarById } from "@/config/avatarLibrary";

describe("avatar system", () => {
  it("renders a system avatar fallback instead of initials", () => {
    const html = renderToStaticMarkup(<Avatar name="Aster Bekele" />);

    expect(html).toContain("/avatars/");
    expect(html).toContain("profile avatar");
    expect(html).not.toContain(">AB<");
  });

  it("builds a stable fallback chain", () => {
    const chain = buildAvatarFallbackChain("student-seed", "student");

    expect(chain).toHaveLength(3);
    expect(new Set(chain).size).toBe(chain.length);
    expect(chain[0]).toMatch(/^\/avatars\/student-/);
  });

  it("resolves known avatar ids", () => {
    expect(getSystemAvatarById("mentor-01")?.url).toBe("/avatars/mentor-01.svg");
  });
});

