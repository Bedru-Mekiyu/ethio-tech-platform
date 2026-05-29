/* eslint-disable react-refresh/only-export-components */
import { cn } from "@/lib/utils";
import { Label } from "./input";
import { motion, AnimatePresence } from "framer-motion";

export function FormField({
  id,
  label,
  error,
  description,
  required,
  children,
  className,
}: {
  id: string;
  label: string;
  error?: string;
  description?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  const errorId = error ? `${id}-error` : undefined;
  const descId = description ? `${id}-desc` : undefined;

  return (
    <div className={cn("space-y-1.5 w-full", className)}>
      <Label htmlFor={id} required={required}>
        {label}
      </Label>
      <div className="relative">{children}</div>
      {description ? (
        <p id={descId} className="text-xs text-[var(--text-secondary)] mt-1">
          {description}
        </p>
      ) : null}
      <AnimatePresence initial={false}>
        {error && (
          <motion.p
            id={errorId}
            role="alert"
            initial={{ opacity: 0, y: -6, height: 0 }}
            animate={{
              opacity: 1,
              y: 0,
              height: "auto",
              x: [0, -6, 6, -4, 4, 0],
            }}
            exit={{ opacity: 0, y: -4, height: 0 }}
            transition={{
              height: { type: "spring", stiffness: 500, damping: 35 },
              opacity: { duration: 0.15 },
              x: { duration: 0.35, ease: "easeInOut" },
            }}
            className="text-xs text-danger font-medium mt-1 select-none flex items-center gap-1 overflow-hidden"
          >
            <svg
              className="w-3.5 h-3.5 shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

export function fieldAriaProps(id: string, error?: string, description?: string) {
  const describedBy = [error ? `${id}-error` : null, description ? `${id}-desc` : null].filter(Boolean).join(" ") || undefined;
  return {
    id,
    "aria-invalid": error ? (true as const) : undefined,
    "aria-describedby": describedBy,
  };
}

