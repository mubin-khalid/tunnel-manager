import { Loader2, Play, StopCircle } from "lucide-react";
import StatusDot from "@/components/ui/StatusDot";
import type { DashboardControlBarProps } from "@/types/component-props";

/** Primary start/stop controls and status for the dashboard. */
export default function DashboardControlBar({
  running,
  loading,
  ngrokInstalled,
  hasAuthtoken,
  tunnelCount,
  onStart,
  onStop,
}: DashboardControlBarProps) {
  return (
    <div className="flex items-center justify-between mb-5 bg-secondary border border-border rounded-md p-5">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <StatusDot
            running={running}
            variant="row"
            className="w-2.5 h-2.5"
            title={running ? "Running" : "Stopped"}
          />
          <span
            className={
              running
                ? "font-mono text-[13px] font-medium text-primary"
                : "font-mono text-[13px] font-medium text-muted-foreground"
            }
          >
            {running ? "Running" : "Stopped"}
          </span>
        </div>
        {running && tunnelCount > 0 && (
          <span className="inline-flex items-center px-2 py-px rounded-[3px] font-mono text-[11px] font-medium bg-primary/10 text-primary">
            {tunnelCount} tunnel{tunnelCount !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      <div className="flex gap-2">
        {!running ? (
          <button
            className="cursor-pointer bg-primary text-[#00110b] font-semibold text-[13px] px-4 py-2 rounded-md tracking-[0.02em] hover:bg-primary-dark disabled:bg-border2 disabled:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-85 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30 transition-colors duration-150"
            onClick={onStart}
            disabled={loading || !ngrokInstalled || !hasAuthtoken}
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 size={16} className="animate-spin" />
                Starting…
              </span>
            ) : (
              <span className="inline-flex items-center gap-2">
                <Play size={16} />
                Start ngrok
              </span>
            )}
          </button>
        ) : (
          <button
            className="cursor-pointer bg-red-500/10 text-danger text-[13px] px-[14px] py-2 rounded-md border border-red-500/30 hover:bg-red-500/15 hover:border-red-500/40 hover:text-danger disabled:cursor-not-allowed disabled:opacity-70 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30 transition-colors duration-150"
            onClick={onStop}
            disabled={loading}
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 size={16} className="animate-spin" />
                Stopping…
              </span>
            ) : (
              <span className="inline-flex items-center gap-2">
                <StopCircle size={16} />
                Stop ngrok
              </span>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
