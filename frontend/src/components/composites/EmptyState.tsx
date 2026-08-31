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
        "rounded-xl border border-[#27272A] bg-[#0E0E11] flex flex-col items-center justify-center gap-3.5 px-6 py-10 text-center shadow-md",
        className,
      )}
      role="status"
    >
      <span className="rounded-full border border-indigo-500/20 bg-indigo-500/10 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-indigo-400 select-none">
        {eyebrow}
      </span>

      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#141418] border border-[#27272A] text-zinc-500 select-none relative">
        {illustration ?? <Inbox size={22} className="text-zinc-400" />}
      </div>

      <div className="max-w-md space-y-1">
        <h3 className="text-sm font-semibold text-white tracking-tight">{title}</h3>
        {description && <p className="text-xs text-zinc-400 leading-relaxed max-w-sm mx-auto">{description}</p>}
      </div>

      {actionLabel && (
        <div className="mt-1">
          {actionHref ? (
            <Link to={actionHref} className="inline-flex">
              <Button size="sm" className="font-medium text-xs">
                {actionLabel}
              </Button>
            </Link>
          ) : (
            <Button size="sm" onClick={onAction} className="font-medium text-xs">
              {actionLabel}
            </Button>
          )}
        </div>
      )}
    </motion.div>
  );
}
