/* eslint-disable react-refresh/only-export-components */
import { useState, useCallback, createContext, useContext, useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { CheckCircle2, AlertTriangle, Info, X, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

type ToastVariant = "success" | "error" | "warning" | "info";

interface Toast {
  id: string;
  message: string;
  variant: ToastVariant;
  duration?: number;
}

export interface ToastApi {
  toast: (message: string, variant?: ToastVariant, duration?: number) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  warning: (message: string) => void;
  info: (message: string) => void;
}

type ToastContextValue = ToastApi;

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

const icons: Record<ToastVariant, typeof Info> = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const variantStyles: Record<ToastVariant, string> = {
  success: "border-success/25 bg-success/10 text-success shadow-[0_4px_20px_rgba(16,185,129,0.1)]",
  error:
    "border-danger/25 bg-danger/10 text-[var(--text-danger)] shadow-[0_4px_20px_rgba(239,68,68,0.1)]",
  warning: "border-warning/25 bg-warning/10 text-warning shadow-[0_4px_20px_rgba(245,158,11,0.1)]",
  info: "border-primary/25 bg-primary/10 text-primary shadow-[0_4px_20px_rgba(99,102,241,0.1)]",
};

let nextId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timersRef = useRef(new Map<string, number>());

  const removeToast = useCallback((id: string) => {
    const timer = timersRef.current.get(id);
    if (timer) {
      window.clearTimeout(timer);
      timersRef.current.delete(id);
    }
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (message: string, variant: ToastVariant = "info", duration = 4000) => {
      const id = `toast-${++nextId}`;
      setToasts((prev) => [...prev.slice(-3), { id, message, variant, duration }]);
      if (duration > 0) {
        const timer = window.setTimeout(() => removeToast(id), duration);
        timersRef.current.set(id, timer);
      }
    },
    [removeToast],
  );

  const ctx: ToastContextValue = {
    toast: addToast,
    success: (msg: string) => addToast(msg, "success"),
    error: (msg: string) => addToast(msg, "error"),
    warning: (msg: string) => addToast(msg, "warning"),
    info: (msg: string) => addToast(msg, "info"),
  };

  useEffect(
    () => () => {
      for (const timer of timersRef.current.values()) {
        window.clearTimeout(timer);
      }
      timersRef.current.clear();
    },
    [],
  );

  return (
    <ToastContext.Provider value={ctx}>
      {children}
      <div
        className="pointer-events-none fixed bottom-24 left-4 right-4 z-[9999] flex flex-col gap-2.5 md:left-auto md:right-6 md:bottom-6 md:w-96"
        role="status"
        aria-live="polite"
      >
        <AnimatePresence>
          {toasts.map((t) => {
            const Icon = icons[t.variant];
            return (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, y: 15, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.92, y: -10 }}
                transition={{ type: "spring", stiffness: 350, damping: 28 }}
                className={cn(
                  "pointer-events-auto flex items-start gap-3 rounded-xl border px-4 py-3.5 shadow-xl backdrop-blur-md select-none",
                  variantStyles[t.variant],
                )}
              >
                <Icon size={18} className="mt-0.5 flex-shrink-0" />
                <p className="flex-1 text-sm font-semibold text-white leading-relaxed">{t.message}</p>
                <button
                  type="button"
                  onClick={() => removeToast(t.id)}
                  className="flex-shrink-0 text-white/50 hover:text-white transition-colors duration-200 p-0.5 rounded-md hover:bg-white/5"
                  aria-label="Dismiss notification"
                >
                  <X size={15} />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
