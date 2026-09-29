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
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-2xl dark:border-white/[0.12] dark:bg-[#1a2236] dark:shadow-[var(--shadow-floating)]"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h2>
        <p className="mt-2 text-xs sm:text-sm text-slate-700 leading-relaxed dark:text-slate-300">{description}</p>

        {requireReason && onReasonChange && (
          <textarea
            value={reason}
            onChange={(e) => onReasonChange(e.target.value)}
            placeholder={`Enter ${reasonLabel.toLowerCase()}...`}
            className="mt-4 min-h-[90px] w-full rounded-xl border border-slate-200 bg-white p-3 text-xs sm:text-sm text-slate-800 outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 resize-y dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-100 dark:focus:border-white/30"
            aria-label={reasonLabel}
          />
        )}

        <div className="mt-6 flex flex-col-reverse sm:flex-row justify-end gap-2.5 sm:gap-3">
          <Button variant="outline" size="sm" onClick={onClose} disabled={loading} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button
            variant={confirmVariant}
            size="sm"
            onClick={onConfirm}
            disabled={!canConfirm || loading}
            className="w-full sm:w-auto"
          >
            {loading ? "Processing…" : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
