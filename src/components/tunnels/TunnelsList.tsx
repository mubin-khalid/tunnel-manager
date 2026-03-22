import TunnelRow from "@/components/tunnels/TunnelRow";
import type { TunnelsListProps } from "@/types/component-props";

/** Scrollable list of tunnel rows for the Tunnels page. */
export default function TunnelsList({
  tunnels,
  disabled,
  running,
  onEdit,
  onDelete,
}: TunnelsListProps) {
  const entries = Object.entries(tunnels);
  const count = entries.length;

  return (
    <div className="bg-secondary border border-border rounded-md p-5 mb-2.5">
      <div className="flex items-center justify-between mb-3 border-b border-border pb-3">
        <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#484848]">
          TUNNELS LIST
        </div>
        <div className="text-[12px] font-mono text-[#3a3a3a] shrink-0">
          <span className="bg-primary/10 text-primary px-2 py-1 rounded-full">
            {count}
          </span>{" "}
          tunnel{count !== 1 ? "s" : ""}
        </div>
      </div>

      <div className="divide-y divide-border">
        {entries.map(([name, entry]) => (
          <TunnelRow
            key={name}
            name={name}
            entry={entry}
            disabled={disabled}
            running={running}
            onEdit={() => onEdit(name, entry)}
            onDelete={() => onDelete(name)}
          />
        ))}
      </div>
    </div>
  );
}
