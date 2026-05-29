import { cn } from "@/lib/utils";
import { forwardRef } from "react";

export interface SwitchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
  description?: string;
  error?: string;
}

export const Switch = forwardRef<HTMLInputElement, SwitchProps>(
  ({ label, description, error, id, className, ...props }, ref) => {
    const switchId = id || `switch-${Math.random().toString(36).slice(2, 9)}`;

    return (
      <div className="flex flex-col gap-2">
        <label htmlFor={switchId} className="flex cursor-pointer items-center gap-3">
          <span className="relative inline-flex h-6 w-11 shrink-0">
            <input
              ref={ref}
              id={switchId}
              type="checkbox"
              role="switch"
              className={cn("peer sr-only", className)}
              {...props}
            />
            <span
              className={cn(
                "h-6 w-11 rounded-full border border-[var(--border)] bg-[var(--bg-elevated)]/50 transition-[background-color,border-color] duration-200 peer-checked:border-primary peer-checked:bg-primary/30 peer-focus-visible:ring-2 peer-focus-visible:ring-primary",
                error && "border-danger/50"
              )}
              aria-hidden
            />
            <span
              className="pointer-events-none absolute top-1 left-1 h-4 w-4 rounded-full bg-white shadow-md transition-transform duration-200 peer-checked:translate-x-5"
              aria-hidden
            />
          </span>
          {label ? (
            <span className="flex flex-col gap-1">
              <span className="text-sm font-medium text-white">{label}</span>
              {description ? <span className="text-xs text-[var(--text-secondary)]">{description}</span> : null}
            </span>
          ) : null}
        </label>
        {error ? <p className="text-xs text-danger">{error}</p> : null}
      </div>
    );
  }
);

Switch.displayName = "Switch";
