import { Check } from "lucide-react";
import type { SaveRowProps } from "@/types/component-props";

/** Save button with transient “saved” feedback. */
export default function SaveRow({ saved, saving, onSave }: SaveRowProps) {
  return (
    <div className="flex items-center justify-end gap-3">
      {saved && (
        <span className="text-[12px] text-primary font-mono animate-fadein inline-flex items-center gap-2">
          <Check size={14} />
          Settings saved
        </span>
      )}
      <button
        className="bg-primary text-[#00110b] font-semibold text-[13px] px-4 py-2 rounded-md tracking-[0.02em] hover:bg-primary-dark disabled:bg-border2 disabled:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-85 transition-colors duration-150"
        onClick={onSave}
        disabled={saving}
        type="button"
      >
        {saving ? "Saving…" : "Save Settings"}
      </button>
    </div>
  );
}
