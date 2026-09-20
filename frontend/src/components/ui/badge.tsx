import { cn } from "@/lib/utils";

export interface BadgeProps {
  className?: string;
  variant?: "default" | "success" | "warning" | "purple" | "danger" | "cyan" | "outline" | "indigo";
  size?: "sm" | "md";
  showDot?: boolean;
  children: React.ReactNode;
}

export function Badge({ className, variant = "default", size = "md", showDot = false, children }: BadgeProps) {
  const variants = {
    default: "border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200/70",
    success: "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100/70",
    warning: "border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100/70",
    purple: "border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100/70",
    danger: "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100/70",
    cyan: "border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100/70",
    outline: "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
    indigo: "border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100/70",
  };

  const sizes = {
    sm: "px-2 py-0.5 text-[10px] gap-1 font-medium",
    md: "px-2.5 py-0.5 text-xs gap-1.5 font-medium",
  };

  const dotColors = {
    default: "bg-slate-500",
    success: "bg-emerald-600",
    warning: "bg-amber-600",
    purple: "bg-indigo-600",
    danger: "bg-rose-600",
    cyan: "bg-sky-600",
    outline: "bg-slate-400",
    indigo: "bg-indigo-600",
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
