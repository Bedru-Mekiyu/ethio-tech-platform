import { cn } from "@/lib/utils";
import { forwardRef } from "react";

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--bg-input)] px-4 text-sm text-[var(--text-primary)]",
          "placeholder:text-[var(--text-muted)]",
          "transition-[border-color,box-shadow] duration-200",
          "focus:border-[var(--border-focus)] focus:outline-none focus:shadow-[var(--shadow-input-focus)]",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "aria-[invalid=true]:border-danger/50 aria-[invalid=true]:shadow-[0_0_0_3px_rgba(255,75,92,0.1)]",
          className,
        )}
        {...props}
      />
    );
  },
);

Input.displayName = "Input";

export const Textarea = forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          "min-h-[120px] w-full rounded-xl border border-[var(--border)] bg-[var(--bg-input)] px-4 py-3 text-sm text-[var(--text-primary)]",
          "placeholder:text-[var(--text-muted)]",
          "transition-[border-color,box-shadow] duration-200",
          "focus:border-[var(--border-focus)] focus:outline-none focus:shadow-[var(--shadow-input-focus)]",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "aria-[invalid=true]:border-danger/50 aria-[invalid=true]:shadow-[0_0_0_3px_rgba(255,75,92,0.1)]",
          className,
        )}
        {...props}
      />
    );
  },
);

Textarea.displayName = "Textarea";

export function Label({
  className,
  children,
  htmlFor,
  required,
}: {
  className?: string;
  children: React.ReactNode;
  htmlFor?: string;
  required?: boolean;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className={cn("mb-1.5 block text-sm font-medium tracking-[0.01em] text-[var(--text-primary)]", className)}
    >
      {children}
      {required && <span className="ml-0.5 text-danger">*</span>}
    </label>
  );
}
