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
          "bg-primary text-white shadow-xs border border-violet-500/30 hover:bg-[var(--primary-hover)] active:scale-[0.98]",
        secondary:
          "border border-[#27272A] bg-[#141418] text-zinc-200 hover:border-zinc-700 hover:bg-[#1E1E24] active:scale-[0.98]",
        outline:
          "border border-[#27272A] bg-transparent text-zinc-300 hover:border-zinc-700 hover:bg-white/[0.04] hover:text-white active:scale-[0.98]",
        ghost: "bg-transparent text-zinc-400 hover:bg-white/[0.04] hover:text-white active:scale-[0.98]",
        danger:
          "bg-danger text-white shadow-xs border border-rose-500/30 hover:bg-[var(--danger-hover)] active:scale-[0.98]",
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
