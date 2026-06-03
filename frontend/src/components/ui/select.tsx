import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import { forwardRef, type ReactNode } from "react";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options?: Array<{ value: string; label: string }>;
  placeholder?: string;
  value?: string;
  onValueChange?: (value: string) => void;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, options, placeholder, children, value, onValueChange, ...props }, ref) => {
    return (
      <div className="relative group w-full">
        <select
          ref={ref}
          value={value}
          onChange={(e) => onValueChange?.(e.target.value)}
          className={cn(
            "h-11 w-full cursor-pointer appearance-none rounded-xl border border-[var(--border)] bg-[var(--bg-input)] px-4 pr-10 text-sm text-white",
            "shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]",
            "transition-[border-color,box-shadow,background-color] duration-200",
            "focus:border-[var(--border-focus)] focus:outline-none focus:shadow-[var(--shadow-input-focus)]",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "aria-[invalid=true]:border-danger/50 aria-[invalid=true]:shadow-[0_0_0_3px_rgba(255,75,92,0.1)]",
            className
          )}
          {...props}
        >
          {placeholder && !children ? (
            <option value="" disabled className="bg-[var(--bg-input)] text-[var(--text-muted)]">
              {placeholder}
            </option>
          ) : null}
          {children ??
            options?.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-[var(--bg-input)] text-white">
                {opt.label}
              </option>
            ))}
        </select>
        <ChevronDown
          size={16}
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] transition-transform duration-200 group-focus-within:rotate-180 group-focus-within:text-white"
        />
      </div>
    );
  }
);

Select.displayName = "Select";

export function SelectContent({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export function SelectItem({ value, children }: { value: string; children: ReactNode }) {
  return <option value={value}>{children}</option>;
}

export function SelectTrigger({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={className}>{children}</div>;
}

export function SelectValue({ placeholder }: { placeholder?: string }) {
  return <span>{placeholder}</span>;
}
