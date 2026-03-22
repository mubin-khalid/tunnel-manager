import { AlertTriangle } from "lucide-react";
import type { TunnelsAuthWarningCardProps } from "@/types/component-props";

/** Banner on the Tunnels page when ngrok is not installed or the token is missing. */
export default function TunnelsAuthWarningCard({
  ngrokInstalled,
}: TunnelsAuthWarningCardProps) {
  return (
    <div className="bg-amber-500/10 border border-amber-500/30 text-warning rounded-md px-3.5 py-2.5 text-[13px] mb-4">
      {!ngrokInstalled ? (
        <span className="inline-flex items-center gap-2">
          <AlertTriangle size={16} />
          Install <code className="font-mono">ngrok</code> first to add tunnels.
        </span>
      ) : (
        <span className="inline-flex items-center gap-2">
          <AlertTriangle size={16} />
          Add your ngrok authtoken in <strong>Settings</strong> first.
        </span>
      )}
    </div>
  );
}
