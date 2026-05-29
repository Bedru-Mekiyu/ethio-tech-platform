import { cn } from "@/lib/utils";
import { useId, useState } from "react";
import type { ReactNode } from "react";

export interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  className?: string;
  contentClassName?: string;
}

export function Tooltip({
  content,
  children,
  side = "top",
  className,
  contentClassName,
}: TooltipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const tooltipId = useId();

  const sideClasses = {
    top: "bottom-full left-1/2 mb-2 -translate-x-1/2",
    right: "left-full top-1/2 ml-2 -translate-y-1/2",
    bottom: "top-full left-1/2 mt-2 -translate-x-1/2",
    left: "right-full top-1/2 mr-2 -translate-y-1/2",
  };

  return (
    <span
      className={cn("relative inline-flex", className)}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
      onFocus={() => setIsOpen(true)}
      onBlur={() => setIsOpen(false)}
    >
      <span aria-describedby={isOpen ? tooltipId : undefined}>{children}</span>

      {isOpen ? (
        <span
          id={tooltipId}
          role="tooltip"
          className={cn(
            "pointer-events-none absolute z-50 max-w-xs rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2 text-xs font-medium text-white shadow-lg",
            sideClasses[side],
            contentClassName
          )}
        >
          {content}
        </span>
      ) : null}
    </span>
  );
}
