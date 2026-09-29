import { Moon, Sun } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useThemeStore } from "@/store/themeStore";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  className?: string;
  size?: "sm" | "md";
}

export function ThemeToggle({ className, size = "md" }: ThemeToggleProps) {
  const { theme, toggleTheme } = useThemeStore();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={cn(
        "relative inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary select-none overflow-hidden",
        "dark:border-white/10 dark:bg-white/[0.07] dark:text-slate-200 dark:hover:bg-white/[0.12] dark:hover:text-white",
        size === "sm" ? "h-8 w-8" : "h-9 w-9",
        className,
      )}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      title={isDark ? "Switch to light theme" : "Switch to dark theme"}
    >
      <AnimatePresence mode="wait" initial={false}>
        {isDark ? (
          <motion.span
            key="sun"
            initial={{ rotate: -90, opacity: 0, scale: 0.7 }}
            animate={{ rotate: 0, opacity: 1, scale: 1 }}
            exit={{ rotate: 90, opacity: 0, scale: 0.7 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="flex items-center justify-center"
          >
            <Sun size={size === "sm" ? 14 : 16} className="text-amber-400" />
          </motion.span>
        ) : (
          <motion.span
            key="moon"
            initial={{ rotate: 90, opacity: 0, scale: 0.7 }}
            animate={{ rotate: 0, opacity: 1, scale: 1 }}
            exit={{ rotate: -90, opacity: 0, scale: 0.7 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="flex items-center justify-center"
          >
            <Moon size={size === "sm" ? 14 : 16} className="text-slate-600" />
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}

export function ThemeSegmentedControl({ className }: { className?: string }) {
  const { theme, setTheme } = useThemeStore();

  return (
    <div
      role="radiogroup"
      aria-label="Theme selection"
      className={cn(
        "inline-flex items-center rounded-xl border border-slate-200 bg-slate-100/80 p-1 text-xs font-medium dark:border-white/10 dark:bg-slate-900/80",
        className,
      )}
    >
      <button
        type="button"
        role="radio"
        aria-checked={theme === "light"}
        onClick={() => setTheme("light")}
        className={cn(
          "flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-all duration-150 select-none",
          theme === "light"
            ? "bg-white text-slate-900 shadow-xs font-semibold dark:bg-slate-800 dark:text-white dark:shadow-[0_0_0_1px_rgba(255,255,255,0.1)]"
            : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white",
        )}
      >
        <Sun size={13} className={theme === "light" ? "text-amber-500" : ""} />
        <span>Light (Default)</span>
      </button>

      <button
        type="button"
        role="radio"
        aria-checked={theme === "dark"}
        onClick={() => setTheme("dark")}
        className={cn(
          "flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-all duration-150 select-none",
          theme === "dark"
            ? "bg-white text-slate-900 shadow-xs font-semibold dark:bg-slate-800 dark:text-white dark:shadow-[0_0_0_1px_rgba(255,255,255,0.1)]"
            : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white",
        )}
      >
        <Moon size={13} className={theme === "dark" ? "text-blue-400" : ""} />
        <span>Dark Mode</span>
      </button>
    </div>
  );
}
