import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatXp(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}k`;
  return String(value);
}

export const RANKS = [
  { minLevel: 1, title: "Explorer" },
  { minLevel: 5, title: "Builder" },
  { minLevel: 10, title: "Creator" },
  { minLevel: 15, title: "Innovator" },
  { minLevel: 20, title: "Ambassador" },
] as const;

export function getRankTitle(level: number): string {
  const rank = [...RANKS].reverse().find((r) => level >= r.minLevel);
  return rank?.title ?? "Explorer";
}
