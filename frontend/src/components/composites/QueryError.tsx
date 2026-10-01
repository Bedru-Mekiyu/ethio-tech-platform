import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function QueryError({
  message = "Unable to load data at this time.",
  onRetry,
  className,
}: {
  message?: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-slate-200 bg-slate-50 dark:border-[#27272A] dark:bg-[#0E0E11] p-6 text-center space-y-3",
        className,
      )}
      role="alert"
      aria-live="assertive"
    >
      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-rose-500/10 text-rose-500 dark:text-rose-400 border border-rose-500/20">
        <AlertTriangle size={18} />
      </div>
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wider text-rose-600 dark:text-rose-400">
          Unable to Load Data
        </p>
        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed max-w-md mx-auto">{message}</p>
      </div>
      {onRetry ? (
        <Button
          size="sm"
          variant="outline"
          onClick={onRetry}
          className="gap-1.5 text-xs text-slate-700 dark:text-slate-300"
        >
          <RefreshCw size={13} />
          Try again
        </Button>
      ) : null}
    </div>
  );
}
