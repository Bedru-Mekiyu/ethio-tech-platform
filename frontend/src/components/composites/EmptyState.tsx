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
    <div className="surface-panel flex flex-col items-center justify-center gap-4 px-6 py-10 text-center">
      <div className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-primary">
        Learning space
      </div>
      <div className="max-w-md">
        <h3 className="text-xl font-semibold text-white">{title}</h3>
        {description ? <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{description}</p> : null}
      </div>
      {actionLabel && actionHref ? (
        <Link to={actionHref} className="inline-flex">
          <Button>{actionLabel}</Button>
        </Link>
      ) : null}
      {actionLabel && onAction && !actionHref ? (
        <Button onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}
