import { Button } from "@/components/ui/button";

interface MentorActionConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  confirmVariant?: "primary" | "danger" | "outline";
  loading?: boolean;
  requireReason?: boolean;
  reasonLabel?: string;
  reason?: string;
  onReasonChange?: (value: string) => void;
  onClose: () => void;
  onConfirm: () => void;
}

export function MentorActionConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  confirmVariant = "primary",
  loading = false,
  requireReason = false,
  reasonLabel = "Reason",
  reason = "",
  onReasonChange,
  onClose,
  onConfirm,
}: MentorActionConfirmDialogProps) {
  if (!open) return null;

  const canConfirm = !requireReason || reason.trim().length > 0;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">{description}</p>

        {requireReason && onReasonChange && (
          <textarea
            value={reason}
            onChange={(e) => onReasonChange(e.target.value)}
            placeholder={`Enter ${reasonLabel.toLowerCase()}...`}
            className="mt-4 min-h-[100px] w-full rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-3 text-sm text-[var(--text-primary)] outline-none focus:border-primary resize-y"
            aria-label={reasonLabel}
          />
        )}

        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant={confirmVariant}
            onClick={onConfirm}
            disabled={!canConfirm || loading}
          >
            {loading ? "Processing…" : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
