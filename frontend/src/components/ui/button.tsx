import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-xl border border-transparent font-medium tracking-[0.01em] transition-[transform,box-shadow,background-color,border-color,color,opacity] duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-base)] disabled:pointer-events-none disabled:opacity-50 hover:-translate-y-0.5 active:translate-y-0",
  {
    variants: {
      variant: {
        primary:
          "bg-primary text-bg-base shadow-[0_12px_32px_rgba(0,210,255,0.28)] hover:shadow-[0_14px_36px_rgba(0,210,255,0.34)]",
        secondary:
          "border border-secondary/40 bg-secondary/12 text-white hover:border-secondary/60 hover:bg-secondary/20",
        outline:
          "border border-primary/40 bg-transparent text-primary hover:border-primary/60 hover:bg-primary/10",
        ghost: "bg-transparent text-text-secondary hover:bg-white/5 hover:text-white",
        danger: "bg-danger text-white shadow-[0_12px_30px_rgba(255,75,92,0.22)] hover:brightness-110",
      },
      size: {
        sm: "h-8 px-3 text-sm",
        md: "h-11 px-4 text-sm",
        lg: "h-12 px-6 text-base",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return (
    <button className={cn(buttonVariants({ variant, size }), className)} {...props} />
  );
}
