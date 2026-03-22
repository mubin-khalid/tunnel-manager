import { Loader2 } from "lucide-react";

/** Loading placeholder while fetching tunnel data from the local ngrok API. */
export default function DashboardWaitingState() {
  return (
    <div className="text-center py-16 px-5 text-muted-foreground">
      <span className="text-[32px] mb-3 opacity-40 inline-flex justify-center">
        <Loader2 className="animate-spin" size={34} />
      </span>
      <p>Waiting for tunnels…</p>
      <p className="text-[12px] mt-1 opacity-60">
        Make sure tunnels are defined in your config
      </p>
    </div>
  );
}
