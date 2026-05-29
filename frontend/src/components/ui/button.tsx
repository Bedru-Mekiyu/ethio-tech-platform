/* eslint-disable react-refresh/only-export-components */
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Spinner } from "./spinner";

const buttonVariants = cva(
  "relative inline-flex items-center justify-center gap-2 rounded-xl border border-transparent font-medium tracking-[0.01em] transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-base)] disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        primary:
          "bg-primary text-[var(--text-inverse)] shadow-[0_1px_2px_rgba(0,0,0,0.2),0_8px_24px_rgba(0,210,255,0.25)] hover:bg-[var(--primary-hover)] hover:shadow-[0_1px_2px_rgba(0,0,0,0.2),0_12px_32px_rgba(0,210,255,0.32)] hover:-translate-y-px",
        secondary:
          "border-secondary/40 bg-secondary/10 text-white hover:border-secondary/60 hover:bg-secondary/18 hover:-translate-y-px",
        outline:
          "border-[var(--border-strong)] bg-transparent text-[var(--text-primary)] hover:border-primary/50 hover:bg-[var(--primary-subtle)] hover:text-primary",
        ghost:
          "bg-transparent text-[var(--text-secondary)] hover:bg-white/5 hover:text-white",
        danger:
          "bg-danger text-white shadow-[0_1px_2px_rgba(0,0,0,0.2),0_8px_24px_rgba(255,75,92,0.2)] hover:brightness-110 hover:-translate-y-px",
      },
      size: {
        sm: "h-8 px-3 text-xs rounded-lg gap-1.5",
        md: "h-10 px-4 text-sm",
        lg: "h-12 px-6 text-sm font-semibold",
        icon: "h-10 w-10 p-0",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
}

export function Button({ className, variant, size, loading, children, disabled, ...props }: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <button
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={isDisabled}
      {...props}
    >
      {loading ? (
        <>
          <Spinner size="sm" className="absolute" />
          <span className="invisible">{children}</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}

export { buttonVariants };
