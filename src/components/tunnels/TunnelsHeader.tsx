import { Check, Plus } from "lucide-react";
import { useTunnels } from "@/contexts/TunnelContext";
import type { TunnelsHeaderProps } from "@/types/component-props";

/** Tunnels page title row with add-tunnel and saved-state affordances. */
export default function TunnelsHeader({
  showForm,
  saved,
  canEdit,
  ngrokInstalled,
  actionDisabled,
  onAdd,
}: TunnelsHeaderProps) {
  const { enabledTunnels, definitions } = useTunnels();
  const totalCount = Object.keys(definitions).length;
  const enabledCount = enabledTunnels.filter((n) => n in definitions).length;

  return (
    <div className="flex items-start justify-between mb-7">
      <div>
        <h1 className="text-xl font-semibold text-foreground tracking-[-0.01em]">
          Tunnels
        </h1>
        <p className="text-[13px] text-muted-foreground mt-1">
          Configure tunnels written to{" "}
          <code className="font-mono text-[12px] bg-muted border border-border rounded px-1.5 py-px">
            ~/.config/ngrok-manager/ngrok.yml
          </code>
        </p>

        {totalCount > 0 && (
          <div className="flex items-center gap-3 mt-2">
            <span className="font-mono text-[12px] text-muted-foreground">
              <span className="text-foreground font-medium">
                {enabledCount}
              </span>
              <span> / {totalCount} enabled</span>
            </span>
            {enabledCount >= 3 && (
              <span className="text-[11px] text-warning inline-flex items-center gap-1">
                ⚠ Free plan: max 3 active tunnels at once
              </span>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 shrink-0">
        {saved && (
          <span className="text-[12px] text-primary font-mono animate-fadein inline-flex items-center gap-2">
            <Check size={14} />
            Saved
          </span>
        )}
        {!showForm && (
          <button
            className="bg-primary text-[#00110b] font-semibold text-[13px] px-4 py-2 rounded-md tracking-[0.02em] hover:bg-primary-dark disabled:bg-border2 disabled:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-85 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30"
            disabled={actionDisabled || !canEdit}
            onClick={onAdd}
            title={
              !canEdit
                ? !ngrokInstalled
                  ? "Install ngrok first"
                  : "Set your ngrok authtoken in Settings first"
                : ""
            }
          >
            <span className="inline-flex items-center gap-2">
              <Plus size={16} />
              New tunnel
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
