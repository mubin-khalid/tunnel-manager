import { Pencil, Trash2 } from "lucide-react";
import StatusDot from "@/components/ui/StatusDot";
import { useTunnels } from "@/contexts/TunnelContext";
import type { TunnelRowProps } from "@/types/component-props";

const protoStyles: Record<string, { badge: string; badgeText: string }> = {
  http: { badge: "bg-primary/10 border-primary/20", badgeText: "text-primary" },
  tcp: {
    badge: "bg-amber-500/10 border-amber-500/20",
    badgeText: "text-amber-300",
  },
  tls: {
    badge: "bg-violet-500/10 border-violet-500/20",
    badgeText: "text-violet-300",
  },
};

/** One saved tunnel: enable toggle, proto badge, edit/delete actions. */
export default function TunnelRow({
  name,
  entry,
  disabled,
  running,
  onEdit,
  onDelete,
}: TunnelRowProps) {
  const { enabledTunnels, toggleTunnel, definitions } = useTunnels();
  const proto = entry.proto?.toLowerCase() ?? "http";
  const styles = protoStyles[proto] ?? protoStyles.http;

  const isEnabled = enabledTunnels.includes(name);
  const enabledCount = enabledTunnels.filter((n) => n in definitions).length;
  const atLimit = enabledCount >= 3 && !isEnabled;

  return (
    <div className="flex items-start justify-between gap-3 py-4 transition-colors duration-150 hover:bg-muted/20">
      <div className="flex items-start gap-3 flex-1 min-w-0">
        <StatusDot
          running={running && isEnabled}
          variant="row"
          className="mt-[7px] shrink-0"
          title={running && isEnabled ? "Active" : "Inactive"}
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-mono text-[13px] font-medium text-foreground truncate">
              {name}
            </span>
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
              <span className="truncate">
                {entry.host_header} → {entry.addr}
              </span>
            ) : (
              <span className="truncate">{entry.addr}</span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0 mt-[3px]">
        {/* Enable / disable toggle */}
        <button
          role="switch"
          aria-checked={isEnabled}
          onClick={() => !disabled && toggleTunnel(name)}
          disabled={disabled || (atLimit && !isEnabled)}
          title={
            atLimit && !isEnabled
              ? "Free plan: max 3 active tunnels"
              : isEnabled
                ? "Disable tunnel"
                : "Enable tunnel"
          }
          className={[
            "relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
            isEnabled ? "bg-primary" : "bg-border2",
            disabled || (atLimit && !isEnabled)
              ? "opacity-50 cursor-not-allowed"
              : "cursor-pointer",
          ].join(" ")}
        >
          <span
            className={[
              "pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200",
              isEnabled ? "translate-x-4" : "translate-x-0",
            ].join(" ")}
          />
        </button>

        <button
          className="w-8 h-8 rounded-md border border-border2 bg-muted/20 text-muted-foreground hover:bg-muted/40 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50 transition-colors duration-150 focus-visible:outline-none flex items-center justify-center"
          onClick={onEdit}
          disabled={disabled}
          title="Edit tunnel"
          aria-label="Edit tunnel"
        >
          <Pencil size={13} />
        </button>

        <button
          className="w-8 h-8 rounded-md border border-border2 bg-muted/20 text-muted-foreground hover:bg-red-500/10 hover:text-danger hover:border-red-500/30 disabled:cursor-not-allowed disabled:opacity-50 transition-colors duration-150 focus-visible:outline-none flex items-center justify-center"
          onClick={onDelete}
          disabled={disabled}
          title="Delete tunnel"
          aria-label="Delete tunnel"
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}
