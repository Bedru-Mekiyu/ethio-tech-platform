import { cn } from "@/lib/utils";

export interface ProgressBarProps {
  value: number;
  max?: number;
  className?: string;
  color?: "primary" | "success" | "purple" | "danger" | "gradient";
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
    success: "bg-success",
    purple: "bg-secondary",
    danger: "bg-danger",
    gradient: "bg-gradient-to-r from-primary via-secondary to-[#c084fc]",
  };

  const glows = {
    primary: "shadow-[0_0_12px_rgba(0,210,255,0.4)]",
    success: "shadow-[0_0_12px_rgba(46,204,113,0.4)]",
    purple: "shadow-[0_0_12px_rgba(123,97,255,0.4)]",
    danger: "shadow-[0_0_12px_rgba(255,75,92,0.4)]",
    gradient: "shadow-[0_0_16px_rgba(0,210,255,0.35)]",
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

