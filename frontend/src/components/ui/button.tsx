/* eslint-disable react-refresh/only-export-components */
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Spinner } from "./spinner";

const buttonVariants = cva(
  "relative inline-flex items-center justify-center gap-2 rounded-xl border border-transparent font-medium tracking-[0.01em] transition-all duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-base)] disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer whitespace-nowrap shrink-0",
  {
    variants: {
      variant: {
        primary:
          "bg-gradient-to-b from-red-600 to-primary text-white shadow-[var(--shadow-crimson-cta)] border border-red-700/80 hover:from-red-500 hover:to-primary-hover hover:shadow-[var(--shadow-crimson-hover)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all dark:border-red-600/70",
        secondary:
          "border border-slate-200/90 bg-white text-slate-800 shadow-[var(--shadow-xs)] hover:border-slate-300 hover:bg-slate-50/80 hover:text-slate-950 hover:shadow-[var(--shadow-sm)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all dark:border-white/10 dark:bg-white/[0.07] dark:text-slate-100 dark:hover:bg-white/[0.12] dark:hover:text-white dark:hover:border-white/20 dark:active:bg-white/[0.09]",
        outline:
          "border border-slate-200/90 bg-transparent text-slate-700 hover:border-slate-300 hover:bg-slate-50/80 hover:text-slate-900 active:scale-[0.98] transition-all dark:border-white/15 dark:text-slate-200 dark:hover:bg-white/[0.08] dark:hover:text-white dark:hover:border-white/25 dark:hover:shadow-[0_0_0_1px_rgba(255,255,255,0.08)]",
        ghost:
          "bg-transparent text-slate-600 hover:bg-slate-100/70 hover:text-slate-900 active:scale-[0.98] transition-all dark:text-slate-300 dark:hover:bg-white/[0.08] dark:hover:text-white dark:active:bg-white/[0.12]",
        danger:
          "bg-gradient-to-b from-red-500 to-danger text-white shadow-xs border border-red-700 hover:from-red-600 hover:to-red-700 active:scale-[0.98] transition-all",
      },
      size: {
        sm: "h-8 px-2.5 sm:px-3 text-xs rounded-lg gap-1.5",
        md: "h-9 px-3.5 sm:px-4 text-xs sm:text-sm rounded-xl gap-2",
        lg: "h-10 sm:h-11 px-4 sm:px-5 text-sm sm:text-base font-semibold rounded-xl gap-2.5",
        icon: "h-9 w-9 p-0 rounded-xl shrink-0",
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
