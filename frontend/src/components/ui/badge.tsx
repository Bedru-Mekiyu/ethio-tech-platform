import { cn } from "@/lib/utils";

export interface BadgeProps {
  className?: string;
  variant?: "default" | "success" | "warning" | "danger" | "outline" | "primary" | "secondary";
  size?: "sm" | "md";
  showDot?: boolean;
  children: React.ReactNode;
}

export function Badge({ className, variant = "default", size = "md", showDot = false, children }: BadgeProps) {
  const variants = {
    default:
      "border-slate-200/80 bg-slate-100/70 text-slate-800 hover:bg-slate-200/70 dark:border-white/10 dark:bg-slate-800/80 dark:text-slate-200",
    primary:
      "border-red-200/80 bg-red-50 text-red-800 hover:bg-red-100/70 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300",
    secondary:
      "border-blue-200/70 bg-blue-50/70 text-[var(--secondary)] font-semibold shadow-xs hover:bg-blue-100/70 dark:border-white/10 dark:bg-slate-800/60 dark:text-slate-200",
    success:
      "border-emerald-200/80 bg-emerald-50 text-emerald-800 hover:bg-emerald-100/70 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300",
    warning:
      "border-amber-200/80 bg-amber-50 text-amber-800 hover:bg-amber-100/70 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300",
    danger:
      "border-red-200/80 bg-red-50 text-red-700 hover:bg-red-100/70 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300",
    outline:
      "border-slate-200/90 bg-white text-slate-700 shadow-xs hover:bg-slate-50 dark:border-white/15 dark:bg-transparent dark:text-slate-200",
  };

  const sizes = {
    sm: "px-2 py-0.5 text-xs gap-1 font-medium",
    md: "px-2.5 py-0.5 text-xs gap-1.5 font-medium",
  };

  const dotColors = {
    default: "bg-zinc-500",
    primary: "bg-red-700",
    secondary: "bg-[var(--secondary)]",
    success: "bg-emerald-600",
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
