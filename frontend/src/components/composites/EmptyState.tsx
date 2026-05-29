import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Inbox } from "lucide-react";
import { cn } from "@/lib/utils";

export interface EmptyStateProps {
  title: string;
  description?: string;
  eyebrow?: string;
  illustration?: React.ReactNode;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  title,
  description,
  eyebrow = "Workspace",
  illustration,
  actionLabel,
  actionHref,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "surface-panel flex flex-col items-center justify-center gap-4.5 px-6 py-12 text-center shadow-inner",
        className
      )}
      role="status"
    >
      <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-0.5 text-[9px] font-bold uppercase tracking-[0.24em] text-primary select-none">
        {eyebrow}
      </span>

      <motion.div
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/3 border border-white/5 shadow-md text-[var(--text-muted)] mt-2 select-none relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5" />
        {illustration ?? <Inbox size={26} className="text-[var(--text-secondary)] opacity-80" />}
      </motion.div>

      <div className="max-w-md space-y-2 mt-1">
        <h3 className="text-lg font-bold text-white tracking-tight leading-snug">{title}</h3>
        {description && (
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed max-w-sm mx-auto font-medium">
            {description}
          </p>
        )}
      </div>

      {actionLabel && (
        <div className="mt-2.5">
          {actionHref ? (
            <Link to={actionHref} className="inline-flex">
              <Button size="md" className="font-semibold shadow-sm">
                {actionLabel}
              </Button>
            </Link>
          ) : (
            <Button size="md" onClick={onAction} className="font-semibold shadow-sm">
              {actionLabel}
            </Button>
          )}
        </div>
      )}
    </motion.div>
  );
}
