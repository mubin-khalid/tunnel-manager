import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { TunnelEntry } from "@/types";

const EMPTY_FORM = { name: "", proto: "http", addr: "", host_header: "" };

const inputClass =
  "w-full bg-muted border border-border text-foreground font-mono text-[13px] rounded-md px-3 py-2 outline-none transition-colors duration-150 focus:border-primary placeholder:text-muted-foreground/40";

interface Props {
  ngrokInstalled: boolean;
  hasAuthtoken: boolean;
}

export default function Tunnels({ ngrokInstalled, hasAuthtoken }: Props) {
  const [tunnels, setTunnels] = useState<Record<string, TunnelEntry>>({});
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingName, setEditingName] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const canEdit = ngrokInstalled && hasAuthtoken;

  useEffect(() => {
    invoke<Record<string, TunnelEntry>>("read_tunnels")
      .then((t) => setTunnels(t ?? {}))
      .catch((e: any) => {
        setError(e?.toString() ?? "Failed to load tunnels");
        setTunnels({});
      });
  }, []);

  useEffect(() => {
    if (!canEdit) {
      setShowForm(false);
      setEditingName(null);
    }
  }, [canEdit]);

  const tunnelList = Object.entries(tunnels);

  const saveTunnels = async (updated: Record<string, TunnelEntry>): Promise<boolean> => {
    setSaving(true);
    try {
      await invoke("update_tunnels", { tunnels: updated });
      setTunnels(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      return true;
    } catch (e: any) {
      setError(e?.toString() ?? "Failed to save");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.addr.trim()) {
      setError("Name and address are required");
      return;
    }
    if (!canEdit) {
      setError(!ngrokInstalled
        ? "Install ngrok first to add tunnels."
        : "Set your ngrok authtoken in Settings first."
      );
      return;
    }
    setError("");
    const entry: TunnelEntry = {
      proto: form.proto,
      addr: form.addr.trim(),
      ...(form.host_header?.trim() ? { host_header: form.host_header.trim() } : {}),
    };
    const updated = { ...tunnels };
    if (editingName && editingName !== form.name.trim()) delete updated[editingName];
    updated[form.name.trim()] = entry;
    const ok = await saveTunnels(updated);
    if (!ok) return;
    setForm(EMPTY_FORM);
    setShowForm(false);
    setEditingName(null);
  };

  const handleEdit = (name: string, entry: TunnelEntry) => {
    setForm({ name, proto: entry.proto, addr: entry.addr, host_header: entry.host_header ?? "" });
    setEditingName(name);
    setShowForm(true);
    setError("");
  };

  const handleDelete = async (name: string) => {
    if (!canEdit) {
      setError(!ngrokInstalled
        ? "Install ngrok first to edit tunnels."
        : "Set your ngrok authtoken in Settings first."
      );
      return;
    }
    const updated = { ...tunnels };
    delete updated[name];
    await saveTunnels(updated);
  };

  const handleCancel = () => {
    setForm(EMPTY_FORM);
    setShowForm(false);
    setEditingName(null);
    setError("");
  };

  return (
    <div className="w-full h-full p-8">
      <div className="max-w-3xl mx-auto">

        {/* Header */}
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
              <span className="text-[12px] text-primary font-mono animate-fadein">✓ Saved</span>
            )}
            {!showForm && (
              <button
                className="bg-primary text-[#00110b] font-semibold text-[13px] px-4 py-2 rounded-md tracking-[0.02em] hover:bg-primary-dark disabled:bg-border2 disabled:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-85 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30"
                disabled={!canEdit}
                onClick={() => { setShowForm(true); setEditingName(null); setForm(EMPTY_FORM); }}
                title={!canEdit ? (!ngrokInstalled ? "Install ngrok first" : "Set your ngrok authtoken in Settings first") : ""}
              >
                + Add Tunnel
              </button>
            )}
          </div>
        </div>

        {/* Auth warning */}
        {!canEdit && !showForm && (
          <div className="bg-amber-500/10 border border-amber-500/30 text-warning rounded-md px-3.5 py-2.5 text-[13px] mb-4">
            {!ngrokInstalled ? (
              <><span>⚠</span> Install <code className="font-mono">ngrok</code> first to add tunnels.</>
            ) : (
              <><span>⚠</span> Add your ngrok authtoken in <strong>Settings</strong> first.</>
            )}
          </div>
        )}

        {/* Add / Edit form */}
        {showForm && (
          <div className="bg-secondary border border-border rounded-md mb-4">
            <div className="px-5 pt-5 pb-4">
              <div className="text-[13px] font-semibold text-foreground">
                {editingName ? `Edit: ${editingName}` : "New Tunnel"}
              </div>
            </div>
            <div className="h-px bg-border" />
            <div className="px-5 pt-4 pb-5">

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-danger rounded-md px-3.5 py-2.5 text-[13px] mb-4">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground mb-1.5 block">
                    Tunnel Name
                  </label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. shopify-app"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground mb-1.5 block">
                    Protocol
                  </label>
                  <select
                    value={form.proto}
                    onChange={(e) => setForm({ ...form, proto: e.target.value })}
                    className={inputClass}
                  >
                    <option value="http">http</option>
                    <option value="tcp">tcp</option>
                    <option value="tls">tls</option>
                  </select>
                </div>
              </div>

              <div className="mb-4">
                <label className="text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground mb-1.5 block">
                  Local Address
                </label>
                <input
                  value={form.addr}
                  onChange={(e) => setForm({ ...form, addr: e.target.value })}
                  placeholder="e.g. http://shopify-app.test or 3000"
                  className={inputClass}
                />
              </div>

              <div className="mb-5">
                <label className="text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground mb-1.5 block">
                  Host Header{" "}
                  <span className="text-[10px] font-normal normal-case opacity-50">(optional)</span>
                </label>
                <input
                  value={form.host_header}
                  onChange={(e) => setForm({ ...form, host_header: e.target.value })}
                  placeholder="e.g. shopify-app.test"
                  className={inputClass}
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  className="bg-transparent text-muted-foreground text-[13px] px-3.5 py-2 rounded-md border border-border hover:bg-muted hover:text-foreground hover:border-border2 transition-colors duration-150 focus-visible:outline-none"
                  onClick={handleCancel}
                >
                  Cancel
                </button>
                <button
                  className="bg-primary text-[#00110b] font-semibold text-[13px] px-4 py-2 rounded-md tracking-[0.02em] hover:bg-primary-dark disabled:bg-border2 disabled:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-85 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30"
                  onClick={handleSubmit}
                  disabled={saving}
                >
                  {saving ? "Saving…" : editingName ? "Update Tunnel" : "Add Tunnel"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Empty state */}
        {tunnelList.length === 0 && !showForm && (
          <div className="text-center py-16 px-5 text-muted-foreground">
            <span className="text-[32px] block mb-3 opacity-40">⇄</span>
            <p>No tunnels configured</p>
            <p className="text-[12px] mt-1 opacity-60">Add a tunnel to get started</p>
          </div>
        )}

        {/* Tunnel list */}
        {tunnelList.map(([name, entry]) => (
          <div
            key={name}
            className="flex items-center justify-between gap-3 bg-secondary border border-border rounded-md px-5 py-4 mb-2 transition-colors duration-150 hover:border-border2"
          >
            {/* Left: name + badges */}
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <span className="font-mono text-[13px] font-medium text-foreground shrink-0">{name}</span>
              <span className="inline-flex items-center px-2 py-px rounded-[3px] font-mono text-[11px] font-medium bg-muted text-muted-foreground shrink-0">
                {entry.proto}
              </span>
              {entry.host_header && (
                <span
                  className="inline-flex items-center px-2 py-px rounded-[3px] font-mono text-[11px] bg-muted text-muted-foreground shrink-0"
                  title="host-header"
                >
                  {entry.host_header}
                </span>
              )}
              <code className="font-mono text-[12px] text-muted-foreground bg-muted border border-border rounded px-2 py-px truncate min-w-0">
                {entry.addr}
              </code>
            </div>

            {/* Right: actions */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                className="text-muted-foreground text-[12px] px-2.5 py-1.5 rounded border border-border hover:bg-muted hover:text-foreground hover:border-border2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors duration-150 focus-visible:outline-none"
                onClick={() => handleEdit(name, entry)}
                disabled={!canEdit}
              >
                Edit
              </button>
              <button
                className="text-danger text-[12px] px-2.5 py-1.5 rounded border border-transparent hover:bg-red-500/10 hover:border-red-500/30 disabled:cursor-not-allowed disabled:opacity-50 transition-colors duration-150 focus-visible:outline-none"
                onClick={() => handleDelete(name)}
                disabled={!canEdit}
              >
                Delete
              </button>
            </div>
          </div>
        ))}

      </div>
    </div>
  );
}