import { useState, useEffect } from "react";
import { CheckCircle2, Radio, Zap, ShieldCheck, ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type PaletteKey = "navy" | "teal" | "amber";

interface PaletteMeta {
  key: PaletteKey;
  name: string;
  subtitle: string;
  brandHex: string;
  secondaryHex: string;
  surfaceHex: string;
  tag: string;
  rationale: string;
}

const PALETTE_OPTIONS: PaletteMeta[] = [
  {
    key: "navy",
    name: "Option 1: Crimson + Deep Navy",
    subtitle: "Recommended · Academic Authority",
    brandHex: "#b91c1c",
    secondaryHex: "#1e3a8a",
    surfaceHex: "#f8fafc",
    tag: "High Trust / MIT & Enterprise Feel",
    rationale:
      "Deep navy provides maximum structural gravity and contrast (10.5:1), grounding the energetic crimson CTAs. Checkmarks and indicators feel serious and institutional without looking like alarms.",
  },
  {
    key: "teal",
    name: "Option 2: Crimson + Slate Teal",
    subtitle: "Modern Developer Ecosystem",
    brandHex: "#b91c1c",
    secondaryHex: "#0f766e",
    surfaceHex: "#f0fdfa",
    tag: "Modern Tech / Linear & Supabase",
    rationale:
      "Slate teal provides a cooling complementary counterpoint to crimson. Checkmarks and active badges are crisp, refreshing, and distinctly non-threatening on a clean white surface.",
  },
  {
    key: "amber",
    name: "Option 3: Crimson + Warm Amber",
    subtitle: "High-Energy Craft & Ethiopian Resonance",
    brandHex: "#9f1239",
    secondaryHex: "#b45309",
    surfaceHex: "#fffbeb",
    tag: "Warm Motivating / Gamified XP",
    rationale:
      "Rose-crimson paired with deep warm amber draws inspiration from Ethiopian cultural heritage, giving high motivational warmth to streaks, XP, and badges while preserving WCAG AA legibility.",
  },
];

export function PalettePreviewBanner() {
  const [activePalette, setActivePalette] = useState<PaletteKey>(() => {
    try {
      const saved = localStorage.getItem("ethio_active_palette");
      if (saved === "navy" || saved === "teal" || saved === "amber") {
        return saved;
      }
    } catch {
      // ignore
    }
    return "navy";
  });

  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  const applyPalette = (key: PaletteKey) => {
    setActivePalette(key);
    try {
      localStorage.setItem("ethio_active_palette", key);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    document.documentElement.dataset.palette = activePalette;
  }, [activePalette]);

  const activeOption = PALETTE_OPTIONS.find((p) => p.key === activePalette) || PALETTE_OPTIONS[0];

  return (
    <div
      role="region"
      aria-label="Palette Option Selector"
      className="sticky top-14 z-40 border-b border-zinc-200 bg-white/95 backdrop-blur-md shadow-xs transition-all"
    >
      <div className="page-shell py-3">
        {/* Top Header / Toggle */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-zinc-900 text-white">
              <Sparkles size={15} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-zinc-900">Palette Reviewer</span>
                <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-semibold text-zinc-700 border border-zinc-200">
                  Pick 1 of 3 Options
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-emerald-700 font-medium">
                  <ShieldCheck size={13} /> WCAG AA Verified
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 hidden md:block">
                Currently testing: <strong className="text-zinc-800">{activeOption.name}</strong> —{" "}
                {activeOption.subtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick 3 Options Selector */}
            <div className="inline-flex rounded-lg border border-zinc-200 bg-zinc-100/70 p-0.5">
              {PALETTE_OPTIONS.map((opt) => {
                const isSelected = activePalette === opt.key;
                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => applyPalette(opt.key)}
                    className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-semibold transition-all ${
                      isSelected
                        ? "bg-white text-zinc-900 shadow-xs border border-zinc-200/80"
                        : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/50"
                    }`}
                  >
                    <span
                      className="h-2.5 w-2.5 rounded-full border border-black/10 shrink-0"
                      style={{ backgroundColor: opt.secondaryHex }}
                    />
                    <span>{opt.key === "navy" ? "1: Navy" : opt.key === "teal" ? "2: Teal" : "3: Amber"}</span>
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 transition-colors"
              title={isExpanded ? "Collapse preview details" : "Expand preview details"}
              aria-label={isExpanded ? "Collapse details" : "Expand details"}
            >
              {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
            </button>
          </div>
        </div>

        {/* Detailed Inspection Drawer */}
        {isExpanded && (
          <div className="mt-3 pt-3 border-t border-zinc-200/80 grid gap-3 md:grid-cols-3">
            {PALETTE_OPTIONS.map((opt) => {
              const isSelected = activePalette === opt.key;
              return (
                <div
                  key={opt.key}
                  onClick={() => applyPalette(opt.key)}
                  className={`rounded-xl border p-3.5 cursor-pointer transition-all ${
                    isSelected
                      ? "border-zinc-900 bg-white ring-2 ring-zinc-900/10 shadow-xs"
                      : "border-zinc-200 bg-zinc-50/60 hover:bg-white hover:border-zinc-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-900">{opt.name.split(":")[1]}</span>
                    {isSelected ? (
                      <Badge variant="default" size="sm" className="bg-zinc-900 text-white font-medium text-[10px]">
                        Active Pick
                      </Badge>
                    ) : (
                      <span className="text-[11px] text-zinc-600 hover:underline">Click to test</span>
                    )}
                  </div>

                  <p className="mt-1 text-[11px] text-zinc-600 leading-snug line-clamp-2">{opt.rationale}</p>

                  {/* Swatches & Live Roles */}
                  <div className="mt-2.5 flex items-center gap-2 pt-2 border-t border-zinc-100">
                    <div className="flex items-center gap-1">
                      <span
                        className="h-4 w-4 rounded border border-black/10 shadow-xs"
                        style={{ backgroundColor: opt.brandHex }}
                        title={`Brand Crimson: ${opt.brandHex}`}
                      />
                      <span className="font-mono text-[10px] text-zinc-600">CTA</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <span
                        className="h-4 w-4 rounded border border-black/10 shadow-xs"
                        style={{ backgroundColor: opt.secondaryHex }}
                        title={`Secondary Accent: ${opt.secondaryHex}`}
                      />
                      <span className="font-mono text-[10px] text-zinc-600">Icons/XP</span>
                    </div>

                    <div
                      className="ml-auto flex items-center gap-1 text-[10px] font-medium"
                      style={{ color: opt.secondaryHex }}
                    >
                      <CheckCircle2 size={13} />
                      <Radio size={12} />
                      <Zap size={12} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
