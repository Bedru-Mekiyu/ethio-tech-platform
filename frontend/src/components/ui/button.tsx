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
          "bg-gradient-to-b from-red-600 to-primary text-white shadow-[var(--shadow-crimson-cta)] border border-red-700/80 hover:from-red-500 hover:to-primary-hover hover:shadow-[var(--shadow-crimson-hover)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all",
        secondary:
          "border border-slate-200/90 bg-white text-slate-800 shadow-[var(--shadow-xs)] hover:border-slate-300 hover:bg-slate-50/80 hover:text-slate-950 hover:shadow-[var(--shadow-sm)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all",
        outline:
          "border border-slate-200/90 bg-transparent text-slate-700 hover:border-slate-300 hover:bg-slate-50/80 hover:text-slate-900 active:scale-[0.98] transition-all",
        ghost:
          "bg-transparent text-slate-600 hover:bg-slate-100/70 hover:text-slate-900 active:scale-[0.98] transition-all",
        danger:
          "bg-gradient-to-b from-red-500 to-danger text-white shadow-xs border border-red-700 hover:from-red-600 hover:to-red-700 active:scale-[0.98] transition-all",
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
