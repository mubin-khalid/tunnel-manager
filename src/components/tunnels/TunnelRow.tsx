import { Pencil, Trash2 } from "lucide-react";
import type { TunnelEntry } from "@/types";
import StatusDot from "@/components/ui/StatusDot";

interface Props {
  name: string;
  entry: TunnelEntry;
  disabled: boolean;
  running: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

const protoStyles: Record<string, { badge: string; badgeText: string }> = {
  http: { badge: "bg-primary/10 border-primary/20", badgeText: "text-primary" },
  tcp: { badge: "bg-amber-500/10 border-amber-500/20", badgeText: "text-amber-300" },
  tls: { badge: "bg-violet-500/10 border-violet-500/20", badgeText: "text-violet-300" },
};

export default function TunnelRow({ name, entry, disabled, running, onEdit, onDelete }: Props) {
  const proto = entry.proto?.toLowerCase() ?? "http";
  const styles = protoStyles[proto] ?? protoStyles.http;

  return (
    <div className="flex items-start justify-between gap-3 py-4 transition-colors duration-150 hover:bg-muted/20">
      <div className="flex items-start gap-3 flex-1 min-w-0">
        {/* Align dot with the first line (name/proto) */}
        <StatusDot
          running={running}
          variant="row"
          className="mt-[7px] shrink-0"
          title={running ? "Active" : "Inactive"}
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-mono text-[13px] font-medium text-foreground truncate">{name}</span>
            <span
              className={[
                "inline-flex items-center px-2 py-px rounded-[999px] font-mono text-[11px] font-medium border",
                styles.badge,
                styles.badgeText,
              ].join(" ")}
            >
              {entry.proto}
            </span>
          </div>

          <div className="mt-2 font-mono text-[12px] text-muted-foreground flex items-center gap-2 min-w-0">
            {entry.host_header ? (
              <>
                <span className="truncate">{entry.host_header}</span>
                <span className="opacity-60">→</span>
              </>
            ) : null}
            <code className="truncate min-w-0">{entry.addr}</code>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          className="w-9 h-9 rounded-md border border-border2 bg-muted/20 text-muted-foreground hover:bg-muted/40 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
          onClick={onEdit}
          disabled={disabled}
          title="Edit"
          aria-label="Edit"
        >
          <Pencil size={16} className="mx-auto" />
        </button>
        <button
          className="w-9 h-9 rounded-md border border-red-500/30 bg-red-500/5 text-danger hover:bg-red-500/10 hover:border-red-500/40 disabled:cursor-not-allowed disabled:opacity-50 transition-colors duration-150 focus-visible:outline-none"
          onClick={onDelete}
          disabled={disabled}
          title="Delete"
          aria-label="Delete"
        >
          <Trash2 size={16} className="mx-auto" />
        </button>
      </div>
    </div>
  );
}

