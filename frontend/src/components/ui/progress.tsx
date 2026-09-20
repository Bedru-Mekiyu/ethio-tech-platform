import { cn } from "@/lib/utils";

export interface ProgressBarProps {
  value: number;
  max?: number;
  className?: string;
  color?: "primary" | "success" | "danger" | "gradient" | "neutral";
  showGlow?: boolean;
  label?: string;
  showValueLabel?: boolean;
  size?: "sm" | "md" | "lg";
}

export function ProgressBar({
  value,
  max = 100,
  className,
  color = "primary",
  showGlow = false,
  label,
  showValueLabel = false,
  size = "md",
}: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, Math.round((value / max) * 100)));

  const barSizes = {
    sm: "h-1.5",
    md: "h-2.5",
    lg: "h-4",
  };

  const colors = {
    primary: "bg-primary",
    success: "bg-zinc-800",
    danger: "bg-red-600",
    gradient: "bg-primary",
    neutral: "bg-zinc-700",
  };

  const glows = {
    primary: "",
    success: "",
    danger: "",
    gradient: "",
    neutral: "",
  };

  return (
    <div className={cn("w-full flex flex-col gap-1.5", className)}>
      {(label || showValueLabel) && (
        <div className="flex justify-between items-center text-xs font-medium text-[var(--text-secondary)] tracking-wide">
          {label && <span>{label}</span>}
          {showValueLabel && <span className="text-zinc-900 font-semibold tabular-nums">{pct}%</span>}
        </div>
      )}
      <div
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label || "Progress"}
        className={cn("w-full overflow-hidden rounded-full bg-zinc-100 border border-zinc-200/70", barSizes[size])}
      >
        <div
          className={cn(
            "h-full rounded-full transition-[width] duration-500 ease-out",
            colors[color],
            showGlow && glows[color],
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
