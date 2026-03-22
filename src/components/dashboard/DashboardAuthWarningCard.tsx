import { AlertTriangle } from "lucide-react";
import type { DashboardAuthWarningCardProps } from "@/types/component-props";

/** Inline warning when ngrok is missing from PATH or the authtoken is not set. */
export default function DashboardAuthWarningCard({
  ngrokInstalled,
  hasAuthtoken,
}: DashboardAuthWarningCardProps) {
  if (!ngrokInstalled) {
    return (
      <div className="bg-amber-500/10 border border-amber-500/30 text-warning rounded-md px-[14px] py-[10px] text-[13px] mb-3.5 flex items-center gap-2">
        <AlertTriangle size={16} />
        <span>
          ngrok is not installed or not in PATH. Install it from{" "}
          <a
            href="https://ngrok.com/download"
            target="_blank"
            rel="noreferrer"
            className="text-primary hover:underline"
          >
            ngrok.com/download
          </a>
        </span>
      </div>
    );
  }

  if (!hasAuthtoken) {
    return (
      <div className="bg-amber-500/10 border border-amber-500/30 text-warning rounded-md px-[14px] py-[10px] text-[13px] mb-3.5 flex items-center gap-2">
        <AlertTriangle size={16} />
        <span>
          Add your ngrok authtoken in <strong>Settings</strong> first.
        </span>
      </div>
    );
  }

  return null;
}
