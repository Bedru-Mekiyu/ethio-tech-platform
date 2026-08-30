/* eslint-disable react-refresh/only-export-components */
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Spinner } from "./spinner";

const buttonVariants = cva(
  "relative inline-flex items-center justify-center gap-2 rounded-xl border border-transparent font-medium tracking-[0.01em] transition-all duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-base)] disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer",
  {
    variants: {
      variant: {
        primary:
          "bg-primary text-white shadow-sm border border-indigo-400/20 hover:bg-[var(--primary-hover)] active:scale-[0.98]",
        secondary:
          "border border-[#334155]/80 bg-[#1E293B]/80 text-white hover:border-slate-500 hover:bg-[#334155] active:scale-[0.98]",
        outline:
          "border border-[#1E293B] bg-transparent text-[var(--text-primary)] hover:border-[#334155] hover:bg-white/[0.04] active:scale-[0.98]",
        ghost:
          "bg-transparent text-[var(--text-secondary)] hover:bg-white/[0.06] hover:text-white active:scale-[0.98]",
        danger:
          "bg-danger text-white shadow-sm border border-rose-400/20 hover:bg-[var(--danger-hover)] active:scale-[0.98]",
      },
      size: {
        sm: "h-8 px-3 text-xs rounded-lg gap-1.5",
        md: "h-10 px-4 text-sm rounded-xl",
        lg: "h-12 px-6 text-sm font-semibold rounded-xl",
        icon: "h-10 w-10 p-0 rounded-xl",
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

