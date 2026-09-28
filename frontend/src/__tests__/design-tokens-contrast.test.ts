import { describe, expect, it } from "vitest";

/**
 * WCAG 2.1 Color Luminance and Contrast Calculation
 * Reference: https://www.w3.org/WAI/GL/wiki/Relative_luminance
 */
export function hexToRgb(hex: string): [number, number, number] {
  const cleanHex = hex.replace("#", "").trim();
  if (cleanHex.length === 3) {
    const r = parseInt(cleanHex[0] + cleanHex[0], 16);
    const g = parseInt(cleanHex[1] + cleanHex[1], 16);
    const b = parseInt(cleanHex[2] + cleanHex[2], 16);
    return [r, g, b];
  }
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  return [r, g, b];
}

export function relativeLuminance([r, g, b]: [number, number, number]): number {
  const [rs, gs, bs] = [r / 255, g / 255, b / 255].map((c) =>
    c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4),
  );
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

export function getContrastRatio(hex1: string, hex2: string): number {
  const l1 = relativeLuminance(hexToRgb(hex1));
  const l2 = relativeLuminance(hexToRgb(hex2));
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  const ratio = (lighter + 0.05) / (darker + 0.05);
  return Math.round(ratio * 100) / 100;
}

// ─── Design Tokens Definitions ───
export const PALETTE_TOKENS = {
  surfaces: {
    base: "#ffffff",
    elevated: "#f8fafc",
    card: "#ffffff",
    cardHover: "#f1f5f9",
  },
  typography: {
    primary: "#0f172a",
    secondary: "#475569",
    muted: "#64748b",
    inverse: "#ffffff",
  },
  semantics: {
    success: "#15803d",
    warning: "#b45309",
    danger: "#dc2626",
  },
  borders: {
    normal: "#e2e8f0",
    strong: "#cbd5e1",
  },
  palette1_navy: {
    name: "Tech Crimson & Deep Navy",
    primary: "#b91c1c",
    primaryHover: "#991b1b",
    secondary: "#1e3a8a",
    secondaryHover: "#172554",
    indicator: "#1e40af",
  },
  palette2_teal: {
    name: "Tech Crimson & Slate Teal",
    primary: "#b91c1c",
    primaryHover: "#991b1b",
    secondary: "#0f766e",
    secondaryHover: "#115e59",
    indicator: "#0f766e",
  },
  palette3_amber: {
    name: "Tech Crimson & Warm Amber",
    primary: "#9f1239",
    primaryHover: "#881337",
    secondary: "#92400e",
    secondaryHover: "#78350f",
    indicator: "#b45309",
  },
};

describe("Design System Contrast & WCAG AA Automated Test Suite", () => {
  const { surfaces, typography, semantics, palette1_navy, palette2_teal, palette3_amber } = PALETTE_TOKENS;

  describe("Text Hierarchy against Surfaces (WCAG AA >= 4.5:1 for normal text)", () => {
    it("primary text meets WCAG AA on base white surface", () => {
      const ratio = getContrastRatio(typography.primary, surfaces.base);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
      expect(ratio).toBeGreaterThanOrEqual(14.0); // slate-900 on white is ~16.6:1
    });

    it("primary text meets WCAG AA on elevated subtle surface", () => {
      const ratio = getContrastRatio(typography.primary, surfaces.elevated);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });

    it("secondary text meets WCAG AA on base white surface", () => {
      const ratio = getContrastRatio(typography.secondary, surfaces.base);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });

    it("secondary text meets WCAG AA on elevated surface", () => {
      const ratio = getContrastRatio(typography.secondary, surfaces.elevated);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });

    it("muted text meets WCAG AA on base white surface", () => {
      const ratio = getContrastRatio(typography.muted, surfaces.base);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });

    it("muted text meets WCAG AA on elevated surface", () => {
      const ratio = getContrastRatio(typography.muted, surfaces.elevated);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });
  });

  describe("Semantic Status Colors (WCAG AA >= 4.5:1 for normal text)", () => {
    it("success color meets WCAG AA on base white surface", () => {
      const ratio = getContrastRatio(semantics.success, surfaces.base);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });

    it("warning color meets WCAG AA on base white surface", () => {
      const ratio = getContrastRatio(semantics.warning, surfaces.base);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });

    it("danger color meets WCAG AA on base white surface", () => {
      const ratio = getContrastRatio(semantics.danger, surfaces.base);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });
  });

  describe("Brand Accent Crimson Buttons (WCAG AA >= 4.5:1 for button text)", () => {
    it("white button text on primary crimson meets WCAG AA", () => {
      const ratio = getContrastRatio(typography.inverse, palette1_navy.primary);
      expect(ratio).toBeGreaterThanOrEqual(4.5); // #ffffff on #b91c1c is 6.42:1
    });

    it("white button text on primary hover meets WCAG AA", () => {
      const ratio = getContrastRatio(typography.inverse, palette1_navy.primaryHover);
      expect(ratio).toBeGreaterThanOrEqual(4.5); // #ffffff on #991b1b is 8.52:1
    });

    it("crimson brand link text on white base meets WCAG AA", () => {
      const ratio = getContrastRatio(palette1_navy.primary, surfaces.base);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });
  });

  describe("Palette Candidate 1: Deep Navy Secondary Accent", () => {
    it("navy secondary accent meets WCAG AA text on base surface", () => {
      const ratio = getContrastRatio(palette1_navy.secondary, surfaces.base);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
      expect(ratio).toBeGreaterThanOrEqual(9.0); // Deep navy is ~10.5:1
    });

    it("navy secondary accent meets WCAG AA text on elevated surface", () => {
      const ratio = getContrastRatio(palette1_navy.secondary, surfaces.elevated);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });

    it("navy indicator meets WCAG UI component requirements (>= 3.0:1)", () => {
      const ratio = getContrastRatio(palette1_navy.indicator, surfaces.base);
      expect(ratio).toBeGreaterThanOrEqual(3.0);
    });
  });

  describe("Palette Candidate 2: Slate Teal Secondary Accent", () => {
    it("teal secondary accent meets WCAG AA text on base surface", () => {
      const ratio = getContrastRatio(palette2_teal.secondary, surfaces.base);
      expect(ratio).toBeGreaterThanOrEqual(4.5); // #0f766e on white is 5.42:1
    });

    it("teal secondary indicator meets WCAG UI component requirements (>= 3.0:1)", () => {
      const ratio = getContrastRatio(palette2_teal.indicator, surfaces.base);
      expect(ratio).toBeGreaterThanOrEqual(3.0);
    });
  });

  describe("Palette Candidate 3: Warm Amber Secondary Accent", () => {
    it("amber secondary accent meets WCAG AA text on base surface", () => {
      const ratio = getContrastRatio(palette3_amber.secondary, surfaces.base);
      expect(ratio).toBeGreaterThanOrEqual(4.5); // #92400e on white is 6.86:1
    });

    it("amber secondary indicator meets WCAG UI component requirements (>= 3.0:1)", () => {
      const ratio = getContrastRatio(palette3_amber.indicator, surfaces.base);
      expect(ratio).toBeGreaterThanOrEqual(3.0);
    });

    it("rose-crimson primary on base surface meets WCAG AA", () => {
      const ratio = getContrastRatio(palette3_amber.primary, surfaces.base);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });
  });
});
