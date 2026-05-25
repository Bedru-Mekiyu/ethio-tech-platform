import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function EmptyState({
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
}: {
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
}) {
  return (
    <div className="rounded-xl border border-dashed border-[var(--border)] p-8 text-center">
      <h3 className="text-lg font-semibold">{title}</h3>
      {description ? <p className="mt-2 text-sm text-[var(--text-muted)]">{description}</p> : null}
      {actionLabel && actionHref ? (
        <Link to={actionHref} className="mt-4 inline-block">
          <Button>{actionLabel}</Button>
        </Link>
      ) : null}
      {actionLabel && onAction && !actionHref ? (
        <Button className="mt-4" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}
