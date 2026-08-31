import { cn } from "@/lib/utils";

export interface ProgressBarProps {
  value: number;
  max?: number;
  className?: string;
  color?: "primary" | "success" | "purple" | "danger" | "gradient" | "cyan";
  showGlow?: boolean;
  label?: string;
  showValueLabel?: boolean;
  size?: "sm" | "md" | "lg";
}

export function ProgressBar({
  value,
  max = 100,
  className,
  color = "gradient",
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
    success: "bg-emerald-500",
    purple: "bg-violet-500",
    danger: "bg-rose-500",
    cyan: "bg-violet-500",
    gradient: "bg-primary",
  };

  const glows = {
    primary: "shadow-[0_0_8px_rgba(79,70,229,0.25)]",
    success: "shadow-[0_0_8px_rgba(16,185,129,0.25)]",
    purple: "shadow-[0_0_8px_rgba(79,70,229,0.25)]",
    danger: "shadow-[0_0_8px_rgba(239,68,68,0.25)]",
    cyan: "shadow-[0_0_8px_rgba(79,70,229,0.25)]",
    gradient: "shadow-[0_0_8px_rgba(79,70,229,0.25)]",
  };

  return (
    <div className={cn("w-full flex flex-col gap-1.5", className)}>
      {(label || showValueLabel) && (
        <div className="flex justify-between items-center text-xs font-medium text-[var(--text-secondary)] tracking-wide">
          {label && <span>{label}</span>}
          {showValueLabel && <span className="text-white font-semibold tabular-nums">{pct}%</span>}
        </div>
      )}
      <div
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label || "Progress"}
        className={cn(
          "w-full overflow-hidden rounded-full bg-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.02)]",
          barSizes[size]
        )}
      >
        <div
          className={cn(
            "h-full rounded-full transition-[width] duration-500 ease-out",
            colors[color],
            showGlow && glows[color]
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
