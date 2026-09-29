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

// ─── Genuine Dark Theme Token Definitions ───
export const DARK_PALETTE_TOKENS = {
  surfaces: {
    canvas: "#090d16",
    elevated: "#111827",
    card: "#111827",
    cardHover: "#172033",
    surfaceStrong: "#1e293b",
    input: "#0b0f19",
  },
  typography: {
    primary: "#f8fafc",
    secondary: "#cbd5e1",
    muted: "#94a3b8",
    subtle: "#64748b",
    inverse: "#0f172a",
  },
  semantics: {
    success: "#22c55e",
    warning: "#f59e0b",
    danger: "#ef4444",
  },
  palette1_navy: {
    name: "Tech Crimson & Electric Blue (Dark)",
    primary: "#ef4444",
    primaryHover: "#dc2626",
    secondary: "#3b82f6",
    secondaryHover: "#2563eb",
    indicator: "#60a5fa",
  },
  palette2_teal: {
    name: "Tech Crimson & Slate Teal (Dark)",
    primary: "#ef4444",
    primaryHover: "#dc2626",
    secondary: "#14b8a6",
    secondaryHover: "#0d9488",
    indicator: "#2dd4bf",
  },
  palette3_amber: {
    name: "Rose Crimson & Warm Amber (Dark)",
    primary: "#f43f5e",
    primaryHover: "#e11d48",
    secondary: "#f59e0b",
    secondaryHover: "#d97706",
    indicator: "#fbbf24",
  },
};

describe("Dark Theme Contrast & WCAG AA Automated Verification Suite", () => {
  const { surfaces, typography, semantics, palette1_navy, palette2_teal, palette3_amber } = DARK_PALETTE_TOKENS;

  describe("Dark Text Hierarchy against Dark Surfaces (WCAG AA >= 4.5:1, AAA >= 7.0:1)", () => {
    it("primary text meets WCAG AAA on dark canvas (#090d16)", () => {
      const ratio = getContrastRatio(typography.primary, surfaces.canvas);
      expect(ratio).toBeGreaterThanOrEqual(7.0);
      expect(ratio).toBeGreaterThanOrEqual(17.0); // #f8fafc on #090d16 is ~17.7:1
    });

    it("primary text meets WCAG AAA on elevated card surface (#111827)", () => {
      const ratio = getContrastRatio(typography.primary, surfaces.elevated);
      expect(ratio).toBeGreaterThanOrEqual(7.0);
      expect(ratio).toBeGreaterThanOrEqual(15.0); // #f8fafc on #111827 is ~15.9:1
    });

    it("secondary text meets WCAG AAA on dark canvas", () => {
      const ratio = getContrastRatio(typography.secondary, surfaces.canvas);
      expect(ratio).toBeGreaterThanOrEqual(7.0);
      expect(ratio).toBeGreaterThanOrEqual(11.0); // #cbd5e1 on #090d16 is ~12.3:1
    });

    it("secondary text meets WCAG AAA on elevated card surface", () => {
      const ratio = getContrastRatio(typography.secondary, surfaces.elevated);
      expect(ratio).toBeGreaterThanOrEqual(7.0);
      expect(ratio).toBeGreaterThanOrEqual(11.0); // #cbd5e1 on #111827 is ~11.1:1
    });

    it("muted text meets WCAG AA on dark canvas", () => {
      const ratio = getContrastRatio(typography.muted, surfaces.canvas);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
      expect(ratio).toBeGreaterThanOrEqual(7.0); // #94a3b8 on #090d16 is ~7.2:1
    });

    it("muted text meets WCAG AA on elevated card surface", () => {
      const ratio = getContrastRatio(typography.muted, surfaces.elevated);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
      expect(ratio).toBeGreaterThanOrEqual(6.0); // #94a3b8 on #111827 is ~6.4:1
    });
  });

  describe("Dark Semantic Status Indicators (WCAG AA >= 4.5:1 on Dark Surfaces)", () => {
    it("success green meets WCAG AA on elevated card surface", () => {
      const ratio = getContrastRatio(semantics.success, surfaces.elevated);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
      expect(ratio).toBeGreaterThanOrEqual(7.0); // #22c55e on #111827 is 7.79:1 (WCAG AAA)
    });

    it("warning amber meets WCAG AA on elevated card surface", () => {
      const ratio = getContrastRatio(semantics.warning, surfaces.elevated);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
      expect(ratio).toBeGreaterThanOrEqual(8.0); // #f59e0b on #111827 is ~8.3:1
    });

    it("danger rose meets WCAG AA on elevated card surface", () => {
      const ratio = getContrastRatio(semantics.danger, surfaces.elevated);
      expect(ratio).toBeGreaterThanOrEqual(4.5); // #ef4444 on #111827 is ~4.97:1
    });
  });

  describe("Brand Accent Tuning for Dark Mode (WCAG AA >= 4.5:1)", () => {
    it("calibrated Tech Crimson meets WCAG AA on dark canvas", () => {
      const ratio = getContrastRatio(palette1_navy.primary, surfaces.canvas);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
      expect(ratio).toBeGreaterThanOrEqual(5.0); // #ef4444 on #090d16 is 5.16:1 (WCAG AA)
    });

    it("calibrated Tech Crimson meets WCAG AA on elevated card surface", () => {
      const ratio = getContrastRatio(palette1_navy.primary, surfaces.elevated);
      expect(ratio).toBeGreaterThanOrEqual(4.5); // #ef4444 on #111827 is ~4.97:1
    });

    it("electric blue secondary meets WCAG AA on dark canvas", () => {
      const ratio = getContrastRatio(palette1_navy.secondary, surfaces.canvas);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
      expect(ratio).toBeGreaterThanOrEqual(5.0); // #3b82f6 on #090d16 is ~5.32:1
    });

    it("slate teal secondary meets WCAG AA on dark canvas", () => {
      const ratio = getContrastRatio(palette2_teal.secondary, surfaces.canvas);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
      expect(ratio).toBeGreaterThanOrEqual(7.0); // #14b8a6 on #090d16 is ~7.65:1
    });

    it("warm amber secondary meets WCAG AA on dark canvas", () => {
      const ratio = getContrastRatio(palette3_amber.secondary, surfaces.canvas);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
      expect(ratio).toBeGreaterThanOrEqual(8.0); // #f59e0b on #090d16 is ~9.2:1
    });
  });
});

describe("Light Theme Immutability Guard (Zero Regression Guarantee)", () => {
  it("light theme surfaces remain byte-for-byte unchanged", () => {
    expect(PALETTE_TOKENS.surfaces.base).toBe("#ffffff");
    expect(PALETTE_TOKENS.surfaces.elevated).toBe("#f8fafc");
    expect(PALETTE_TOKENS.surfaces.card).toBe("#ffffff");
    expect(PALETTE_TOKENS.surfaces.cardHover).toBe("#f1f5f9");
  });

  it("light theme typography tokens remain byte-for-byte unchanged", () => {
    expect(PALETTE_TOKENS.typography.primary).toBe("#0f172a");
    expect(PALETTE_TOKENS.typography.secondary).toBe("#475569");
    expect(PALETTE_TOKENS.typography.muted).toBe("#64748b");
    expect(PALETTE_TOKENS.typography.inverse).toBe("#ffffff");
  });

  it("light theme brand accent tokens remain byte-for-byte unchanged", () => {
    expect(PALETTE_TOKENS.palette1_navy.primary).toBe("#b91c1c");
    expect(PALETTE_TOKENS.palette1_navy.primaryHover).toBe("#991b1b");
    expect(PALETTE_TOKENS.palette1_navy.secondary).toBe("#1e3a8a");
    expect(PALETTE_TOKENS.palette1_navy.secondaryHover).toBe("#172554");
    expect(PALETTE_TOKENS.palette1_navy.indicator).toBe("#1e40af");
  });
});
