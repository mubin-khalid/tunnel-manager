import { Network } from "lucide-react";

/** Shown when ngrok is running but the API reports no active tunnels yet. */
export default function DashboardEmptyState() {
  return (
    <div className="text-center py-16 px-5 text-muted-foreground">
      <span className="text-[32px] mb-3 opacity-40 inline-flex justify-center">
        <Network size={34} />
      </span>
      <p>No active tunnels</p>
      <p className="text-[12px] mt-1 opacity-60">
        Start ngrok to expose your local servers
      </p>
    </div>
  );
}
