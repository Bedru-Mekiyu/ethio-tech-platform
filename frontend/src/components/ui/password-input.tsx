import { useState, forwardRef } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "./input";
import { cn } from "@/lib/utils";

export interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  wrapperClassName?: string;
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, wrapperClassName, ...props }, ref) => {
    const [visible, setVisible] = useState(false);

    return (
      <div className={cn("relative group w-full", wrapperClassName)}>
        <Input
          ref={ref}
          className={cn("pr-12", className)}
          type={visible ? "text" : "password"}
          {...props}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className={cn(
            "absolute right-1.5 top-1/2 -translate-y-1/2",
            "h-8 w-8 rounded-lg", // standard visible boundary
            "flex items-center justify-center text-[var(--text-muted)] hover:text-white transition-colors duration-200",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--bg-base)]",
            "after:content-[''] after:absolute after:-inset-1 after:rounded-lg" // invisible expansion for 44px minimum touch target (h-8 is 32px, absolute -inset-1 adds 8px total, total active height is 48px)
          )}
          aria-label={visible ? "Hide password" : "Show password"}
        >
          {visible ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    );
  }
);

PasswordInput.displayName = "PasswordInput";

