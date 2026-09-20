import { cn } from "@/lib/utils";

export interface BadgeProps {
  className?: string;
  variant?: "default" | "success" | "warning" | "danger" | "outline" | "primary";
  size?: "sm" | "md";
  showDot?: boolean;
  children: React.ReactNode;
}

export function Badge({ className, variant = "default", size = "md", showDot = false, children }: BadgeProps) {
  const variants = {
    default: "border-zinc-200 bg-zinc-100 text-zinc-800 hover:bg-zinc-200/70",
    primary: "border-red-200 bg-red-50 text-red-800 hover:bg-red-100/70",
    success: "border-zinc-300 bg-zinc-100 text-zinc-900 hover:bg-zinc-200/70",
    warning: "border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100/70",
    danger: "border-red-200 bg-red-50 text-red-700 hover:bg-red-100/70",
    outline: "border-zinc-200 bg-white text-zinc-800 hover:bg-zinc-50",
  };

  const sizes = {
    sm: "px-2 py-0.5 text-[10px] gap-1 font-medium",
    md: "px-2.5 py-0.5 text-xs gap-1.5 font-medium",
  };

  const dotColors = {
    default: "bg-zinc-500",
    primary: "bg-red-700",
    success: "bg-zinc-800",
    warning: "bg-amber-600",
    danger: "bg-red-600",
    outline: "bg-zinc-400",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border transition-colors duration-150 select-none",
        variants[variant],
        sizes[size],
        className,
      )}
    >
      {showDot && <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", dotColors[variant])} />}
      {children}
    </span>
  );
}
