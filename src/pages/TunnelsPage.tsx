import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { TunnelEntry } from "@/types";
import {
  ConfirmModal,
  TunnelsAuthWarningCard,
  TunnelsEmptyState,
  TunnelsFormCard,
  TunnelsHeader,
  TunnelsList,
} from "@/components";

export type TunnelsPageProps = {
  ngrokInstalled: boolean;
  hasAuthtoken: boolean;
  running: boolean;
  setRunning: (v: boolean) => void;
};

type FormState = { name: string; proto: string; addr: string; host_header: string };

const EMPTY_FORM: FormState = { name: "", proto: "http", addr: "", host_header: "" };

type FieldErrors = Partial<Record<keyof FormState, boolean>>;

type PendingTunnelUpdate = {
  updated: Record<string, TunnelEntry>;
  closeForm: boolean;
};

export default function TunnelsPage({ ngrokInstalled, hasAuthtoken, running, setRunning }: TunnelsPageProps) {
  const [tunnels, setTunnels] = useState<Record<string, TunnelEntry>>({});
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [editingName, setEditingName] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [saved, setSaved] = useState(false);

  const [confirmRestartOpen, setConfirmRestartOpen] = useState(false);
  const [pendingUpdate, setPendingUpdate] = useState<PendingTunnelUpdate | null>(null);

  const canEdit = ngrokInstalled && hasAuthtoken;

  const savedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const tunnelList = useMemo(() => Object.entries(tunnels), [tunnels]);

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

  useEffect(() => {
    return () => {
      if (savedTimeoutRef.current) clearTimeout(savedTimeoutRef.current);
    };
  }, []);

  const triggerSaved = useCallback(() => {
    setSaved(true);
    if (savedTimeoutRef.current) clearTimeout(savedTimeoutRef.current);
    savedTimeoutRef.current = setTimeout(() => setSaved(false), 2000);
  }, []);

  const applyTunnelUpdate = useCallback(
    async (updated: Record<string, TunnelEntry>, closeForm: boolean, restartNgrok: boolean) => {
      setSaving(true);
      try {
        if (restartNgrok) {
          await invoke("stop_ngrok");
          // ngrok may take a moment to fully release resources after kill().
          await new Promise((r) => setTimeout(r, 1200));
        }

        await invoke("update_tunnels", { tunnels: updated });
        setTunnels(updated);

        if (restartNgrok) {
          const shouldStart = Object.keys(updated).length > 0;
          if (shouldStart) {
            await invoke("start_ngrok");
            setRunning(true);
          } else {
            setRunning(false);
          }
        }

        triggerSaved();
        if (closeForm) {
          setForm(EMPTY_FORM);
          setShowForm(false);
          setEditingName(null);
        }
        return true;
      } catch (e: any) {
        // If we were restarting, we already stopped ngrok. Make sure the UI matches.
        if (restartNgrok) setRunning(false);
        setFieldErrors({});
        setError(
          e?.toString() ??
            (restartNgrok ? "Failed to update tunnels (ngrok restart)" : "Failed to save tunnels")
        );
        return false;
      } finally {
        setSaving(false);
      }
    },
    [setRunning, triggerSaved]
  );

  const openRestartConfirm = useCallback((updated: Record<string, TunnelEntry>, closeForm: boolean) => {
    setPendingUpdate({ updated, closeForm });
    setConfirmRestartOpen(true);
  }, []);

  const handleSubmit = async () => {
    const nameMissing = form.name.trim().length === 0;
    const addrMissing = form.addr.trim().length === 0;

    if (nameMissing || addrMissing) {
      setFieldErrors({
        name: nameMissing,
        addr: addrMissing,
      });
      if (nameMissing && addrMissing) setError("Tunnel name and local address are required");
      else if (nameMissing) setError("Tunnel name is required");
      else setError("Local address is required");
      return;
    }
    if (!canEdit) {
      setFieldErrors({});
      setError(!ngrokInstalled ? "Install ngrok first to add tunnels." : "Set your ngrok authtoken in Settings first.");
      return;
    }

    setError("");
    setFieldErrors({});

    const nextName = form.name.trim();
    // Prevent accidental overwrites when saving a new tunnel with an existing name,
    // or when renaming an edited tunnel to an existing name.
    if (tunnels[nextName] && nextName !== editingName) {
      setFieldErrors({ name: true });
      setError("A tunnel with this name already exists. Use a different name.");
      return;
    }

    const entry: TunnelEntry = {
      proto: form.proto,
      addr: form.addr.trim(),
      ...(form.host_header?.trim() ? { host_header: form.host_header.trim() } : {}),
    };

    const updated = { ...tunnels };
    if (editingName && editingName !== nextName) delete updated[editingName];
    updated[nextName] = entry;

    if (running) {
      openRestartConfirm(updated, true);
      return;
    }

    await applyTunnelUpdate(updated, true, false);
  };

  const handleEdit = (name: string, entry: TunnelEntry) => {
    setForm({ name, proto: entry.proto, addr: entry.addr, host_header: entry.host_header ?? "" });
    setEditingName(name);
    setShowForm(true);
    setError("");
    setFieldErrors({});
  };

  const handleDelete = async (name: string) => {
    if (!canEdit) {
      setError(!ngrokInstalled ? "Install ngrok first to edit tunnels." : "Set your ngrok authtoken in Settings first.");
      return;
    }

    const updated = { ...tunnels };
    delete updated[name];

    // If the user deletes the tunnel they are currently editing, close the form too.
    const shouldCloseForm = showForm && editingName === name;

    if (running) {
      openRestartConfirm(updated, shouldCloseForm);
      return;
    }

    await applyTunnelUpdate(updated, shouldCloseForm, false);
  };

  const handleCancel = () => {
    setForm(EMPTY_FORM);
    setShowForm(false);
    setEditingName(null);
    setError("");
    setFieldErrors({});
  };

  const confirmRestart = useCallback(async () => {
    if (!pendingUpdate) return;
    const { updated, closeForm } = pendingUpdate;
    setConfirmRestartOpen(false);
    setPendingUpdate(null);
    setError("");
    await applyTunnelUpdate(updated, closeForm, true);
  }, [applyTunnelUpdate, pendingUpdate]);

  const actionDisabled = !canEdit || saving || confirmRestartOpen;
  const pendingHasTunnels = pendingUpdate ? Object.keys(pendingUpdate.updated).length > 0 : true;

  return (
    <div className="w-full h-full p-8">
      <div className="max-w-3xl mx-auto">
        <TunnelsHeader
          showForm={showForm}
          saved={saved}
          canEdit={canEdit}
          ngrokInstalled={ngrokInstalled}
          actionDisabled={actionDisabled}
          onAdd={() => {
            setShowForm(true);
            setEditingName(null);
            setForm(EMPTY_FORM);
          }}
        />
        {!canEdit && !showForm ? <TunnelsAuthWarningCard ngrokInstalled={ngrokInstalled} /> : null}

        <TunnelsFormCard
          showForm={showForm}
          editingName={editingName}
          form={form}
          error={error}
          fieldErrors={fieldErrors}
          saving={saving}
          actionDisabled={actionDisabled}
          onChange={setForm}
          onCancel={handleCancel}
          onSubmit={handleSubmit}
        />

        {tunnelList.length === 0 && !showForm ? <TunnelsEmptyState /> : null}

        {tunnelList.length > 0 ? (
          <TunnelsList
            tunnels={tunnels}
            disabled={actionDisabled}
            running={running}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ) : null}

        <ConfirmModal
          open={confirmRestartOpen}
          danger
          title="Restart ngrok required"
          message={
            pendingHasTunnels ? (
              <>ngrok is currently running. Updating tunnels requires restarting ngrok, which will restart all tunnels.</>
            ) : (
              <>ngrok is currently running. Updating tunnels requires restarting ngrok, and since there will be no tunnels configured after this change, ngrok will be stopped.</>
            )
          }
          confirmText="Restart ngrok"
          cancelText="Keep running"
          isLoading={saving}
          onCancel={() => {
            setConfirmRestartOpen(false);
            setPendingUpdate(null);
          }}
          onConfirm={confirmRestart}
        />
      </div>
    </div>
  );
}

