import { cn } from "@/lib/utils";
import { createContext, useContext, useState, useId, useRef } from "react";
import type { ReactNode } from "react";
import { motion } from "framer-motion";

export interface TabItem {
  value: string;
  label: string;
  content: ReactNode;
  disabled?: boolean;
}

export interface TabsProps {
  items: TabItem[];
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  variant?: "pill" | "underline";
  className?: string;
  triggerClassName?: string;
  contentClassName?: string;
}

export function Tabs({
  items,
  defaultValue,
  onValueChange,
  variant = "pill",
  className,
  triggerClassName,
  contentClassName,
}: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultValue || items[0]?.value || "");
  const baseId = useId();
  const tabListRef = useRef<HTMLDivElement>(null);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    onValueChange?.(value);
  };

  const activeItem = items.find((item) => item.value === activeTab);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const enabledItems = items.filter((item) => !item.disabled);
    const currentIndex = enabledItems.findIndex((item) => item.value === activeTab);
    if (currentIndex === -1) return;

    let nextIndex: number;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      nextIndex = (currentIndex + 1) % enabledItems.length;
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      nextIndex = (currentIndex - 1 + enabledItems.length) % enabledItems.length;
    } else if (e.key === "Home") {
      nextIndex = 0;
    } else if (e.key === "End") {
      nextIndex = enabledItems.length - 1;
    } else {
      return;
    }

    e.preventDefault();
    const nextValue = enabledItems[nextIndex].value;
    handleTabChange(nextValue);

    // Focus the button
    const buttons = tabListRef.current?.querySelectorAll<HTMLButtonElement>("button[role='tab']");
    const nextButton = Array.from(buttons || []).find(
      (btn) => btn.getAttribute("data-value") === nextValue
    );
    nextButton?.focus();
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div
        ref={tabListRef}
        onKeyDown={handleKeyDown}
        className={cn(
          "flex items-center",
          variant === "pill"
            ? "gap-2 rounded-full border border-white/10 bg-white/5 p-1"
            : "gap-6 border-b border-white/10 pb-0"
        )}
        role="tablist"
      >
        {items.map((item) => {
          const isActive = activeTab === item.value;
          return (
            <button
              key={item.value}
              type="button"
              role="tab"
              data-value={item.value}
              aria-selected={isActive}
              aria-controls={`tab-content-${baseId}-${item.value}`}
              id={`tab-trigger-${baseId}-${item.value}`}
              disabled={item.disabled}
              onClick={() => handleTabChange(item.value)}
              className={cn(
                "relative text-sm font-medium transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-base)]",
                variant === "pill"
                  ? "min-h-10 rounded-full px-4 py-2 text-[var(--text-secondary)] hover:text-white"
                  : "pb-3 pt-2 text-[var(--text-secondary)] hover:text-white",
                isActive && (variant === "pill" ? "text-[var(--bg-base)]" : "text-primary"),
                triggerClassName
              )}
            >
              {isActive && (
                <motion.span
                  layoutId={`active-indicator-${baseId}`}
                  className={cn(
                    "absolute inset-0 -z-10",
                    variant === "pill"
                      ? "rounded-full bg-primary"
                      : "border-b-2 border-primary"
                  )}
                  style={variant === "underline" ? { bottom: 0, height: "2px", top: "auto" } : undefined}
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              <span className="relative z-10">{item.label}</span>
            </button>
          );
        })}
      </div>

      {activeItem ? (
        <div
          id={`tab-content-${baseId}-${activeTab}`}
          role="tabpanel"
          aria-labelledby={`tab-trigger-${baseId}-${activeTab}`}
          className={cn("fade-in focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 rounded-xl", contentClassName)}
        >
          {activeItem.content}
        </div>
      ) : null}
    </div>
  );
}

const TabsContext = createContext<{
  value: string;
  setValue: (value: string) => void;
  variant: "pill" | "underline";
  tabsId: string;
} | null>(null);

export function TabsManual({
  children,
  className,
  defaultValue = "",
  variant = "pill",
}: {
  children: ReactNode;
  className?: string;
  defaultValue?: string;
  variant?: "pill" | "underline";
}) {
  const [value, setValue] = useState(defaultValue);
  const tabsId = useId();
  return (
    <TabsContext.Provider value={{ value, setValue, variant, tabsId }}>
      <div className={cn("space-y-4", className)}>{children}</div>
    </TabsContext.Provider>
  );
}

export function TabsList({ children, className }: { children: ReactNode; className?: string }) {
  const ctx = useContext(TabsContext);
  const variant = ctx?.variant || "pill";

  const listRef = useRef<HTMLDivElement>(null);

  // Keyboard navigation for compound components
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!ctx) return;
    const buttons = listRef.current?.querySelectorAll<HTMLButtonElement>("button[role='tab']");
    if (!buttons) return;

    const enabledButtons = Array.from(buttons).filter((btn) => !btn.disabled);
    const currentBtn = document.activeElement as HTMLButtonElement;
    const currentIndex = enabledButtons.indexOf(currentBtn);
    if (currentIndex === -1 && !enabledButtons.includes(currentBtn)) return;

    let nextIndex: number;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      nextIndex = (currentIndex + 1) % enabledButtons.length;
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      nextIndex = (currentIndex - 1 + enabledButtons.length) % enabledButtons.length;
    } else if (e.key === "Home") {
      nextIndex = 0;
    } else if (e.key === "End") {
      nextIndex = enabledButtons.length - 1;
    } else {
      return;
    }

    e.preventDefault();
    const nextBtn = enabledButtons[nextIndex];
    nextBtn.focus();
    const val = nextBtn.getAttribute("data-value");
    if (val) {
      ctx.setValue(val);
    }
  };

  return (
    <div
      ref={listRef}
      onKeyDown={handleKeyDown}
      className={cn(
        "flex items-center",
        variant === "pill"
          ? "gap-2 rounded-full border border-white/10 bg-white/5 p-1"
          : "gap-6 border-b border-white/10 pb-0",
        className
      )}
      role="tablist"
    >
      {children}
    </div>
  );
}

export function TabsTrigger({
  value,
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { value: string; children: ReactNode }) {
  const ctx = useContext(TabsContext);
  const isActive = ctx?.value === value;
  const variant = ctx?.variant || "pill";
  const tabsId = ctx?.tabsId || "manual-tab";

  return (
    <button
      type="button"
      role="tab"
      data-value={value}
      aria-selected={isActive}
      aria-controls={`tab-content-${tabsId}-${value}`}
      id={`tab-trigger-${tabsId}-${value}`}
      onClick={() => ctx?.setValue(value)}
      className={cn(
        "relative text-sm font-medium transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-base)]",
        variant === "pill"
          ? "min-h-10 rounded-full px-4 py-2 text-[var(--text-secondary)] hover:text-white"
          : "pb-3 pt-2 text-[var(--text-secondary)] hover:text-white",
        isActive && (variant === "pill" ? "text-[var(--bg-base)]" : "text-primary"),
        className
      )}
      {...props}
    >
      {isActive && (
        <motion.span
          layoutId={`active-indicator-${tabsId}`}
          className={cn(
            "absolute inset-0 -z-10",
            variant === "pill"
              ? "rounded-full bg-primary"
              : "border-b-2 border-primary"
          )}
          style={variant === "underline" ? { bottom: 0, height: "2px", top: "auto" } : undefined}
          transition={{ type: "spring", stiffness: 380, damping: 30 }}
        />
      )}
      <span className="relative z-10">{children}</span>
    </button>
  );
}

export function TabsContent({ value, children, className }: { value: string; children: ReactNode; className?: string }) {
  const ctx = useContext(TabsContext);
  const isActive = ctx?.value === value;
  const tabsId = ctx?.tabsId || "manual-tab";

  if (!isActive) return null;

  return (
    <div
      id={`tab-content-${tabsId}-${value}`}
      role="tabpanel"
      aria-labelledby={`tab-trigger-${tabsId}-${value}`}
      className={cn("fade-in focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 rounded-xl", className)}
    >
      {children}
    </div>
  );
}

