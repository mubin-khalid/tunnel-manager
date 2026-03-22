import { Check, Copy, ExternalLink } from "lucide-react";
import StatusDot from "@/components/ui/StatusDot";
import type { DashboardTunnelRowProps } from "@/types/component-props";

const protoStyles: Record<string, { badge: string; badgeText: string }> = {
  http: { badge: "bg-primary/10 border-primary/20", badgeText: "text-primary" },
  https: {
    badge: "bg-primary/10 border-primary/20",
    badgeText: "text-primary",
  },
  tcp: {
    badge: "bg-amber-500/10 border-amber-500/20",
    badgeText: "text-amber-300",
  },
};

/** Single tunnel row: status dot, proto badge, copy/open actions for the public URL. */
export default function DashboardTunnelRow({
  item,
  running,
  copiedUrl,
  disabled,
  onCopy,
  onOpen,
}: DashboardTunnelRowProps) {
  const proto = item.proto?.toLowerCase() ?? "http";
  const styles = protoStyles[proto] ?? protoStyles.http;
  const copied = copiedUrl === item.publicUrl;
  return (
    <div className="flex items-start justify-between gap-3 py-4 transition-colors duration-150 hover:bg-muted/20">
      <div className="flex items-start gap-3 flex-1 min-w-0">
        <StatusDot
          running={running}
          variant="row"
          className="w-2.5 h-2.5 mt-[7px] shrink-0"
          title={running ? "Active" : "Inactive"}
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-mono text-[13px] font-semibold text-foreground truncate">
              {item.name}
            </span>
            <span
              className={[
                "inline-flex items-center px-2 py-px rounded-[999px] font-mono text-[11px] font-medium border shrink-0",
                styles.badge,
                styles.badgeText,
              ].join(" ")}
            >
              {proto}
            </span>
          </div>

          <div className="mt-2 font-mono text-[12px] text-muted-foreground">
            <div className="truncate">{item.configAddr}</div>
            <div className="truncate text-muted-foreground/90">
              {item.publicUrl}
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          className="w-9 h-9 rounded-md border border-border2 bg-muted/20 text-muted-foreground hover:bg-muted/40 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50 transition-colors duration-150 focus-visible:outline-none"
          onClick={() => onCopy(item.publicUrl)}
          disabled={disabled}
          title="Copy URL"
          aria-label="Copy URL"
        >
          {copied ? (
            <Check size={16} className="mx-auto" />
          ) : (
            <Copy size={16} className="mx-auto" />
          )}
        </button>
        <button
          className="w-9 h-9 rounded-md border border-border2 bg-muted/20 text-muted-foreground hover:bg-muted/40 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50 transition-colors duration-150 focus-visible:outline-none"
          onClick={() => onOpen(item.publicUrl)}
          disabled={disabled}
          title="Open in browser"
          aria-label="Open in browser"
        >
          <ExternalLink size={16} className="mx-auto" />
        </button>
      </div>
    </div>
  );
}
