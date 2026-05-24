import { Button } from "@/components/ui/button";

export function QueryError({
  message = "Something went wrong loading this page.",
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div
      className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-6"
      role="alert"
    >
      <p className="font-medium text-[var(--text-primary)]">Unable to load data</p>
      <p className="mt-1 text-sm text-[var(--text-muted)]">{message}</p>
      {onRetry ? (
        <Button className="mt-4" variant="outline" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </div>
  );
}
