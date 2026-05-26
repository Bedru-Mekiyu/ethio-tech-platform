import { cn } from "@/lib/utils";

export function ProgressBar({
  value,
  max = 100,
  className,
  color = "primary",
}: {
  value: number;
  max?: number;
  className?: string;
  color?: "primary" | "success" | "purple";
}) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  const colors = {
    primary: "bg-primary",
    success: "bg-success",
    purple: "bg-secondary",
  };
  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]", className)}>
      <div
        className={cn("h-full rounded-full transition-[width] duration-300 ease-out", colors[color])}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
