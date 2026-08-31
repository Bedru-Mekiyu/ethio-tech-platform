import { cn } from "@/lib/utils";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "elevated" | "interactive" | "ghost";
}

export function Card({ className, variant = "default", children, ...props }: CardProps) {
  const variants = {
    default: "card-surface p-6",
    elevated:
      "card-surface p-6 shadow-[var(--shadow-lg)] border-[var(--border-strong)]",
    interactive:
      "card-surface p-6 hover-lift cursor-pointer hover:border-[var(--border-strong)]",
    ghost:
      "rounded-[var(--radius-2xl)] border border-transparent bg-transparent p-6",
  };

  return (
    <div className={cn(variants[variant], className)} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("mb-4 flex items-center justify-between gap-4", className)}>{children}</div>;
}

export function CardTitle({ className, children }: { className?: string; children: React.ReactNode }) {
  return <h3 className={cn("text-sm font-semibold tracking-tight text-white", className)}>{children}</h3>;
}

export function CardDescription({ className, children }: { className?: string; children: React.ReactNode }) {
  return <p className={cn("mt-0.5 text-xs leading-relaxed text-zinc-400", className)}>{children}</p>;
}

export function CardContent({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("mt-4", className)}>{children}</div>;
}
