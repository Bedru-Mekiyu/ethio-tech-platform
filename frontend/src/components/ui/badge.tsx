import { cn } from "@/lib/utils";

export interface BadgeProps {
  className?: string;
  variant?: "default" | "success" | "warning" | "purple" | "danger";
  size?: "sm" | "md";
  showDot?: boolean;
  children: React.ReactNode;
}

export function Badge({ className, variant = "default", size = "md", showDot = false, children }: BadgeProps) {
  const variants = {
    default: "border-primary/20 bg-primary/8 text-primary hover:bg-primary/12",
    success: "border-success/20 bg-success/8 text-success hover:bg-success/12",
    warning: "border-warning/20 bg-warning/8 text-warning hover:bg-warning/12",
    purple: "border-secondary/20 bg-secondary/8 text-secondary hover:bg-secondary/12",
    danger: "border-danger/20 bg-danger/8 text-danger hover:bg-danger/12",
  };

  const sizes = {
    sm: "px-2 py-0.5 text-[10px] gap-1 tracking-[0.1em]",
    md: "px-3 py-1 text-[11px] gap-1.5 tracking-[0.12em]",
  };

  const dotColors = {
    default: "bg-primary shadow-[0_0_8px_rgba(0,210,255,0.6)]",
    success: "bg-success shadow-[0_0_8px_rgba(46,204,113,0.6)]",
    warning: "bg-warning shadow-[0_0_8px_rgba(241,196,15,0.6)]",
    purple: "bg-secondary shadow-[0_0_8px_rgba(123,97,255,0.6)]",
    danger: "bg-danger shadow-[0_0_8px_rgba(255,75,92,0.6)]",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border font-semibold uppercase backdrop-blur-[2px] transition-colors duration-200",
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
