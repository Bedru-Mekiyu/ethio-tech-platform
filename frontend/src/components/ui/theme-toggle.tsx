import { Moon, Sun } from "lucide-react";
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
        "relative inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary select-none",
        "dark:border-white/10 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 dark:hover:text-white",
        size === "sm" ? "h-8 w-8" : "h-9 w-9",
        className,
      )}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      title={isDark ? "Switch to light theme" : "Switch to dark theme"}
    >
      {isDark ? (
        <Sun size={size === "sm" ? 14 : 16} className="text-amber-400 transition-transform duration-200" />
      ) : (
        <Moon size={size === "sm" ? 14 : 16} className="text-slate-600 transition-transform duration-200" />
      )}
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
            ? "bg-white text-slate-900 shadow-xs font-semibold dark:bg-slate-800 dark:text-white"
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
            ? "bg-white text-slate-900 shadow-xs font-semibold dark:bg-slate-800 dark:text-white"
            : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white",
        )}
      >
        <Moon size={13} className={theme === "dark" ? "text-blue-400" : ""} />
        <span>Dark Mode</span>
      </button>
    </div>
  );
}
