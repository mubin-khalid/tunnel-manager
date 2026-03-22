import { AlertTriangle } from "lucide-react";
import type { ConfirmModalProps } from "@/types/component-props";

/** Accessible confirm/cancel dialog (e.g. destructive tunnel delete or restart). */
export default function ConfirmModal({
  open,
  title,
  message,
  confirmText,
  cancelText = "Cancel",
  danger = false,
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="w-full max-w-md bg-secondary border border-border rounded-md shadow-lg">
        <div className="px-5 pt-5 pb-4">
          <div className="flex items-center gap-2">
            {danger ? (
              <AlertTriangle size={18} className="text-danger shrink-0" />
            ) : null}
            <div className="text-[14px] font-semibold text-foreground">
              {title}
            </div>
          </div>
          <div className="mt-2 text-[13px] text-muted-foreground leading-relaxed">
            {message}
          </div>
        </div>
        <div className="h-px bg-border" />
        <div className="px-5 py-4 flex justify-end gap-2">
          <button
            className="bg-transparent text-muted-foreground text-[13px] px-3.5 py-2 rounded-md border border-border hover:bg-muted hover:text-foreground hover:border-border2 transition-colors duration-150 disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline-none"
            onClick={onCancel}
            disabled={isLoading}
          >
            {cancelText}
          </button>
          <button
            className={[
              danger
                ? "bg-red-500/15 text-danger border border-red-500/30 hover:bg-red-500/20 hover:border-red-500/40"
                : "bg-primary text-[#00110b] font-semibold border border-transparent hover:bg-primary-dark focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30",
              "text-[13px] px-4 py-2 rounded-md tracking-[0.02em] disabled:bg-border2 disabled:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-85 transition-colors duration-150",
            ].join(" ")}
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? "Working…" : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
