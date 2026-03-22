import { useId } from "react";

import type { AuthtokenCardProps } from "@/types/component-props";

const inputClass =
  "w-full bg-muted border border-border text-foreground font-mono text-[13px] rounded-md px-3 py-2 outline-none transition-colors duration-150 focus:border-primary placeholder:text-muted-foreground/40 min-h-[40px]";

/** Masked authtoken input with show/hide toggle. */
export default function AuthtokenCard({
  showToken,
  onToggleShowToken,
  authtoken,
  onChangeAuthtoken,
}: AuthtokenCardProps) {
  const id = useId();

  return (
    <div className="bg-secondary border border-border rounded-md mb-3">
      <div className="px-5 pt-5 pb-4">
        <div className="text-[13px] font-semibold text-foreground">
          ngrok Authtoken
        </div>
        <p className="text-[12px] text-muted-foreground mt-0.5">
          Find your Authtoken at&nbsp;
          <a
            href="https://dashboard.ngrok.com/get-started/your-authtoken"
            target="_blank"
            rel="noreferrer"
            className="text-primary hover:underline"
          >
            NGROK Dashboard
          </a>
        </p>
      </div>
      <div className="h-px bg-border" />
      <div className="px-5 pt-4 pb-5">
        <label
          htmlFor={id}
          className="text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground mb-1.5 block"
        >
          Authtoken
        </label>
        <div className="flex gap-2 items-center">
          <input
            id={id}
            type={showToken ? "text" : "password"}
            value={authtoken}
            onChange={(e) => onChangeAuthtoken(e.target.value)}
            placeholder="2abc123…"
            className={inputClass}
          />
          <button
            className="bg-transparent text-muted-foreground text-[12px] px-3.5 py-2 rounded-md border border-border hover:bg-muted hover:text-foreground hover:border-border2 shrink-0 transition-colors duration-150"
            onClick={onToggleShowToken}
            type="button"
          >
            {showToken ? "Hide" : "Show"}
          </button>
        </div>
      </div>
    </div>
  );
}
