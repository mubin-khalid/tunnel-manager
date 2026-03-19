import { Check, Plus } from "lucide-react";

interface Props {
  showForm: boolean;
  saved: boolean;
  canEdit: boolean;
  ngrokInstalled: boolean;
  actionDisabled: boolean;
  onAdd: () => void;
}

export default function TunnelsHeader({
  showForm,
  saved,
  canEdit,
  ngrokInstalled,
  actionDisabled,
  onAdd,
}: Props) {
  return (
    <div className="flex items-start justify-between mb-7">
      <div>
        <h1 className="text-xl font-semibold text-foreground tracking-[-0.01em]">Tunnels</h1>
        <p className="text-[13px] text-muted-foreground mt-1">
          Configure tunnels written to{" "}
          <code className="font-mono text-[12px] bg-muted border border-border rounded px-1.5 py-px">
            ~/.config/ngrok-manager/ngrok.yml
          </code>
        </p>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        {saved && (
          <span className="text-[12px] text-primary font-mono animate-fadein inline-flex items-center gap-2">
            <Check size={14} />
            Saved
          </span>
        )}
        {!showForm && (
          <button
            className="bg-primary text-[#00110b] font-semibold text-[13px] px-4 py-2 rounded-md tracking-[0.02em] hover:bg-primary-dark disabled:bg-border2 disabled:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-85 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30"
            disabled={actionDisabled || !canEdit}
            onClick={onAdd}
            title={
              !canEdit
                ? !ngrokInstalled
                  ? "Install ngrok first"
                  : "Set your ngrok authtoken in Settings first"
                : ""
            }
          >
            <span className="inline-flex items-center gap-2">
              <Plus size={16} />
              New tunnel
            </span>
          </button>
        )}
      </div>
    </div>
  );
}

