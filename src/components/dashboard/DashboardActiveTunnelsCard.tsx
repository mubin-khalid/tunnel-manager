import type { DashboardTunnelViewModel } from "@/components/dashboard/DashboardTunnelRow";
import DashboardTunnelRow from "@/components/dashboard/DashboardTunnelRow";

interface Props {
  items: DashboardTunnelViewModel[];
  copiedUrl: string | null;
  running: boolean;
  disabled: boolean;
  onCopy: (publicUrl: string) => void;
}

export default function DashboardActiveTunnelsCard({ items, copiedUrl, running, disabled, onCopy }: Props) {
  return (
    <div className="bg-secondary border border-border rounded-md p-5 mb-2.5">
      <div className="flex items-center justify-between mb-3 border-b border-border pb-3">
        <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#484848]">ACTIVE TUNNELS</div>
      </div>

      <div className="divide-y divide-border">
        {items.map((item) => (
          <DashboardTunnelRow
            key={item.key}
            item={item}
            running={running}
            copiedUrl={copiedUrl}
            disabled={disabled}
            onCopy={onCopy}
            onOpen={() => window.open(item.publicUrl, "_blank", "noopener,noreferrer")}
          />
        ))}
      </div>
    </div>
  );
}

