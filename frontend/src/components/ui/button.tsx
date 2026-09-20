/* eslint-disable react-refresh/only-export-components */
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Spinner } from "./spinner";

const buttonVariants = cva(
  "relative inline-flex items-center justify-center gap-2 rounded-lg border border-transparent font-medium tracking-[0.01em] transition-all duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-base)] disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer",
  {
    variants: {
      variant: {
        primary:
          "bg-primary text-white shadow-xs border border-indigo-600 hover:bg-[var(--primary-hover)] active:scale-[0.98]",
        secondary:
          "border border-[var(--border)] bg-white text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:bg-slate-50 hover:text-[var(--text-primary)] active:scale-[0.98] shadow-xs",
        outline:
          "border border-[var(--border)] bg-transparent text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:bg-slate-50 hover:text-[var(--text-primary)] active:scale-[0.98]",
        ghost:
          "bg-transparent text-[var(--text-secondary)] hover:bg-slate-100 hover:text-[var(--text-primary)] active:scale-[0.98]",
        danger:
          "bg-danger text-white shadow-xs border border-red-600 hover:bg-[var(--danger-hover)] active:scale-[0.98]",
      },
      size: {
        sm: "h-8 px-3 text-xs rounded-md gap-1.5",
        md: "h-9 px-4 text-sm rounded-lg",
        lg: "h-11 px-5 text-sm font-semibold rounded-lg",
        icon: "h-9 w-9 p-0 rounded-lg",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  loading?: boolean;
}

export function Button({ className, variant, size, loading, children, disabled, ...props }: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <button className={cn(buttonVariants({ variant, size }), className)} disabled={isDisabled} {...props}>
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
