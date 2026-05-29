import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function QueryError({
  message = "Something went wrong loading this page.",
  onRetry,
  className,
}: {
  message?: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div
      className={cn("surface-panel p-6", className)}
      role="alert"
      aria-live="assertive"
    >
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-danger">Unable to load data</p>
      <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">{message}</p>
      {onRetry ? (
        <Button className="mt-5" variant="outline" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </div>
  );
}
