import { cn } from "@/lib/utils";

export interface BadgeProps {
  className?: string;
  variant?: "default" | "success" | "warning" | "purple" | "danger" | "cyan";
  size?: "sm" | "md";
  showDot?: boolean;
  children: React.ReactNode;
}

export function Badge({ className, variant = "default", size = "md", showDot = false, children }: BadgeProps) {
  const variants = {
    default: "border-[#334155]/60 bg-[#1E293B]/60 text-slate-300 hover:bg-[#1E293B] hover:text-white",
    success: "border-emerald-500/20 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/15",
    warning: "border-amber-500/20 bg-amber-500/10 text-amber-400 hover:bg-amber-500/15",
    purple: "border-indigo-500/20 bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/15",
    danger: "border-rose-500/20 bg-rose-500/10 text-rose-400 hover:bg-rose-500/15",
    cyan: "border-[#334155]/60 bg-[#1E293B]/60 text-slate-300 hover:bg-[#1E293B] hover:text-white",
  };

  const sizes = {
    sm: "px-2 py-0.5 text-[10px] gap-1 font-medium",
    md: "px-2.5 py-0.5 text-xs gap-1.5 font-medium",
  };

  const dotColors = {
    default: "bg-slate-400",
    success: "bg-emerald-400",
    warning: "bg-amber-400",
    purple: "bg-indigo-400",
    danger: "bg-rose-400",
    cyan: "bg-slate-400",
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

