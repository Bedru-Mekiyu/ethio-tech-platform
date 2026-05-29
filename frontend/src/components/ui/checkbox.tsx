import { cn } from "@/lib/utils";
import { forwardRef } from "react";

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  description?: string;
  error?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, description, error, id, ...props }, ref) => {
    const checkboxId = id || `checkbox-${Math.random().toString(36).slice(2, 9)}`;

    return (
      <div className="flex flex-col gap-2">
        <div className="flex items-start gap-3">
          <input
            ref={ref}
            id={checkboxId}
            type="checkbox"
            className={cn(
              "mt-0.5 h-5 w-5 shrink-0 cursor-pointer rounded border border-[var(--border)] bg-[var(--bg-elevated)]/50 accent-primary transition-[border-color,box-shadow] duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-[var(--bg-base)]",
              error && "border-danger/50",
              className
            )}
            {...props}
          />
          {label ? (
            <label htmlFor={checkboxId} className="flex cursor-pointer flex-col gap-1 text-sm leading-5">
              <span className="font-medium text-white">{label}</span>
              {description ? <span className="text-[var(--text-secondary)]">{description}</span> : null}
            </label>
          ) : null}
        </div>
        {error ? <p className="text-xs text-danger">{error}</p> : null}
      </div>
    );
  }
);

Checkbox.displayName = "Checkbox";
