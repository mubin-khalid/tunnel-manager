import { Repeat } from "lucide-react";

/** Empty state when there are no tunnel definitions yet. */
export default function TunnelsEmptyState() {
  return (
    <div className="text-center py-16 px-5 text-muted-foreground">
      <span className="text-[32px] mb-3 opacity-40 inline-flex justify-center">
        <Repeat size={34} />
      </span>
      <p>No tunnels configured</p>
      <p className="text-[12px] mt-1 opacity-60">Add a tunnel to get started</p>
    </div>
  );
}
