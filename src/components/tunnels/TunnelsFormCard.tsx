import FormField from "@/components/ui/FormField";
import type { TunnelsFormCardProps } from "@/types/component-props";
import type { TunnelFormState } from "@/types/tunnel-form";

const baseControlClass =
  "w-full bg-muted border border-border text-foreground font-mono text-[13px] rounded-md px-3 py-2 outline-none transition-colors duration-150 focus:border-primary placeholder:text-muted-foreground/40 min-h-[40px]";

const inputClass = baseControlClass;

// Native `<select>` can render slightly shorter than `<input>` even with the
// same padding/font. Force a min height and line-height to align.
const selectClass = `${baseControlClass} leading-none appearance-none min-h-[40px]`;

/** Add/edit tunnel form: name, proto, addr, optional host header. */
export default function TunnelsFormCard({
  showForm,
  editingName,
  form,
  error,
  fieldErrors,
  saving,
  actionDisabled,
  onChange,
  onCancel,
  onSubmit,
}: TunnelsFormCardProps) {
  if (!showForm) return null;

  const setField = (patch: Partial<TunnelFormState>) =>
    onChange({ ...form, ...patch });
  const hasFieldError = (key: keyof TunnelFormState) => !!fieldErrors[key];

  return (
    <div className="bg-secondary border border-border rounded-md mb-4">
      <div className="px-5 pt-5 pb-4">
        <div className="text-[13px] font-semibold text-foreground">
          {editingName ? `Edit: ${editingName}` : "New Tunnel"}
        </div>
      </div>
      <div className="h-px bg-border" />
      <div className="px-5 pt-4 pb-5">
        {error ? (
          <div
            className="bg-red-500/10 border border-red-500/30 text-danger rounded-md px-3.5 py-2.5 text-[13px] mb-4"
            role="alert"
          >
            <span className="inline-flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-danger/85 shrink-0" />
              <span>{error}</span>
            </span>
          </div>
        ) : null}

        <div className="grid grid-cols-2 gap-3 mb-4">
          <FormField label="Tunnel Name">
            <input
              value={form.name}
              onChange={(e) => setField({ name: e.target.value })}
              placeholder="e.g. example-tunnel"
              className={`${inputClass} ${hasFieldError("name") ? "border-red-500/70 focus:border-red-500/70" : ""}`}
            />
          </FormField>

          <FormField label="Protocol">
            <select
              value={form.proto}
              onChange={(e) => setField({ proto: e.target.value })}
              className={`${selectClass} ${hasFieldError("proto") ? "border-red-500/70 focus:border-red-500/70" : ""}`}
            >
              <option value="http">http</option>
              <option value="tcp">tcp</option>
              <option value="tls">tls</option>
            </select>
          </FormField>
        </div>

        <div className="mb-4">
          <FormField label="Local Address">
            <input
              value={form.addr}
              onChange={(e) => setField({ addr: e.target.value })}
              placeholder="e.g. http://example.test or 3000"
              className={`${inputClass} ${hasFieldError("addr") ? "border-red-500/70 focus:border-red-500/70" : ""}`}
            />
          </FormField>
        </div>

        <div className="mb-5">
          <FormField label="Host Header" hint="(optional)">
            <input
              value={form.host_header}
              onChange={(e) => setField({ host_header: e.target.value })}
              placeholder="e.g. example.test"
              className={`${inputClass} ${hasFieldError("host_header") ? "border-red-500/70 focus:border-red-500/70" : ""}`}
            />
          </FormField>
        </div>

        <div className="flex justify-end gap-2">
          <button
            className="bg-transparent text-muted-foreground text-[13px] px-3.5 py-2 rounded-md border border-border hover:bg-muted hover:text-foreground hover:border-border2 transition-colors duration-150 focus-visible:outline-none disabled:opacity-70 disabled:cursor-not-allowed"
            onClick={onCancel}
            disabled={saving || actionDisabled}
          >
            Cancel
          </button>
          <button
            className="bg-primary text-[#00110b] font-semibold text-[13px] px-4 py-2 rounded-md tracking-[0.02em] hover:bg-primary-dark disabled:bg-border2 disabled:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-85 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30"
            onClick={onSubmit}
            disabled={actionDisabled}
          >
            {saving ? "Saving…" : editingName ? "Update Tunnel" : "Add Tunnel"}
          </button>
        </div>
      </div>
    </div>
  );
}
