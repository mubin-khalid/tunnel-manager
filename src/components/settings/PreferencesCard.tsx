import type { PreferencesCardProps } from "@/types/component-props";

/** Auto-start ngrok when the app launches. */
export default function PreferencesCard({ autoStart, onToggle }: PreferencesCardProps) {
  return (
    <div className="bg-secondary border border-border rounded-md mb-4">
      <div className="px-5 pt-5 pb-4">
        <div className="text-[13px] font-semibold text-foreground">
          Preferences
        </div>
      </div>
      <div className="h-px bg-border" />
      <div className="px-5 py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1">
            <span className="text-[13px] text-foreground block mb-0.5">
              Auto-start ngrok on launch
            </span>
            <span className="text-[12px] text-muted-foreground">
              Automatically run{" "}
              <code className="font-mono text-[11px] bg-muted border border-border rounded px-1.5 py-px">
                ngrok start --all
              </code>{" "}
              when the app opens
            </span>
          </div>
          <button
            className={[
              "w-11 h-6 rounded-full relative shrink-0 transition-colors duration-200 cursor-pointer border-none outline-none",
              autoStart ? "bg-primary" : "bg-border2",
            ].join(" ")}
            onClick={onToggle}
            role="switch"
            aria-checked={autoStart}
            type="button"
          >
            <span
              className={[
                "absolute top-[4px] w-4 h-4 rounded-full bg-white transition-[left] duration-200",
                autoStart ? "left-[22px]" : "left-[4px]",
              ].join(" ")}
            />
          </button>
        </div>
      </div>
    </div>
  );
}
