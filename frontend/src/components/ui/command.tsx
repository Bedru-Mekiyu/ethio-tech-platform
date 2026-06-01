import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Search, Command as CommandIcon } from "lucide-react";

interface CommandItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  onSelect: () => void;
  keywords?: string[];
}

interface CommandPaletteProps {
  items: CommandItem[];
  placeholder?: string;
  emptyMessage?: string;
}

export function CommandPalette({
  items,
  placeholder = "Search or jump to...",
  emptyMessage = "No results found",
}: CommandPaletteProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIdx, setSelectedIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const filtered = items.filter((item) => {
    const q = query.toLowerCase();
    return (
      item.label.toLowerCase().includes(q) ||
      item.keywords?.some((k) => k.toLowerCase().includes(q))
    );
  });

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (open) {
      setTimeout(() => {
        setQuery("");
        setSelectedIdx(0);
        inputRef.current?.focus();
      }, 0);
    }
  }, [open]);

  const handleQueryChange = (value: string) => {
    setQuery(value);
    setSelectedIdx(0);
  };

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIdx((idx) => Math.min(idx + 1, filtered.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIdx((idx) => Math.max(idx - 1, 0));
      } else if (e.key === "Enter" && filtered[selectedIdx]) {
        filtered[selectedIdx].onSelect();
        setOpen(false);
      }
    },
    [filtered, selectedIdx]
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-white/[0.03] px-3 py-2 text-sm text-[var(--text-muted)] hover:border-white/10 hover:text-[var(--text-secondary)] transition-colors duration-200 w-full max-w-xs"
        aria-label="Open command palette"
      >
        <Search size={15} />
        <span className="flex-1 text-left">{placeholder}</span>
        <kbd className="hidden rounded-md border border-[var(--border)] bg-white/[0.04] px-1.5 py-0.5 text-[10px] font-medium text-[var(--text-muted)] sm:inline-flex items-center gap-0.5">
          <CommandIcon size={11} />K
        </kbd>
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-[4px]"
              aria-hidden="true"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: -8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -8 }}
              transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
              className="fixed left-1/2 top-[15%] z-[90] w-full max-w-lg -translate-x-1/2"
              role="dialog"
              aria-modal="true"
              aria-label="Command palette"
            >
              <div className="overflow-hidden rounded-2xl border border-[var(--border-strong)] bg-[rgba(11,14,20,0.98)] shadow-2xl backdrop-blur-xl">
                <div className="flex items-center gap-3 border-b border-[var(--border)] px-4 py-3">
                  <Search size={16} className="text-[var(--text-muted)] shrink-0" />
                  <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => handleQueryChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    className="flex-1 bg-transparent text-sm text-white placeholder:text-[var(--text-muted)] outline-none"
                    aria-label="Search commands"
                    autoComplete="off"
                    spellCheck={false}
                  />
                </div>
                <div
                  ref={listRef}
                  className="max-h-72 overflow-y-auto p-2"
                  role="listbox"
                  aria-label="Command results"
                >
                  {filtered.length === 0 ? (
                    <p className="px-3 py-6 text-center text-sm text-[var(--text-muted)]">
                      {emptyMessage}
                    </p>
                  ) : (
                    filtered.map((item, idx) => (
                      <button
                        key={item.id}
                        type="button"
                        role="option"
                        aria-selected={idx === selectedIdx}
                        onClick={() => {
                          item.onSelect();
                          setOpen(false);
                        }}
                        onMouseEnter={() => setSelectedIdx(idx)}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors duration-100",
                          idx === selectedIdx
                            ? "bg-primary/10 text-primary"
                            : "text-[var(--text-secondary)] hover:bg-white/[0.04] hover:text-white"
                        )}
                      >
                        {item.icon && (
                          <span className="flex-shrink-0 text-[var(--text-muted)]">
                            {item.icon}
                          </span>
                        )}
                        <span className="flex-1 truncate">{item.label}</span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
