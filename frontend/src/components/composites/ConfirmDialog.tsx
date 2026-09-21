import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "default";
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "default",
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleCancel = (e: Event) => {
      e.preventDefault();
      onCancel();
    };

    dialog.addEventListener("cancel", handleCancel);
    return () => dialog.removeEventListener("cancel", handleCancel);
  }, [onCancel]);

  if (!open) return null;

  return (
    <dialog
      ref={dialogRef}
      className="fixed inset-0 z-[9998] m-auto w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-0 text-[var(--text-primary)] shadow-xl backdrop:bg-zinc-900/40 backdrop-blur-xs"
    >
      <div className="p-6">
        <div className="flex items-start justify-between">
          <h2 className="text-lg font-semibold text-zinc-900">{title}</h2>
          <button
            type="button"
            onClick={onCancel}
            className="text-zinc-400 hover:text-zinc-700 transition-colors rounded-lg p-1 hover:bg-zinc-100"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>
        {description && <p className="mt-2 text-sm text-[var(--text-secondary)]">{description}</p>}
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button
            onClick={onConfirm}
            disabled={loading}
            className={variant === "danger" ? "bg-[var(--danger)] hover:bg-[var(--danger)]/80" : ""}
          >
            {loading ? "Processing…" : confirmLabel}
          </Button>
        </div>
      </div>
    </dialog>
  );
}
