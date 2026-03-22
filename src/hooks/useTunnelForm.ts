import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { TunnelEntry } from "@/types";
import {
  EMPTY_TUNNEL_FORM,
  type PendingTunnelUpdate,
  type TunnelFormFieldErrors,
  type TunnelFormState,
} from "@/types/tunnel-form";
import { useTunnels } from "@/contexts/TunnelContext";
import { toErrorString } from "@/utils/error";

/** Inputs from the Tunnels page (ngrok running state and install/token flags). */
export type UseTunnelFormParams = {
  running: boolean;
  setRunning: (v: boolean) => void;
  ngrokInstalled: boolean;
  hasAuthtoken: boolean;
};

/** Everything the Tunnels page reads from `useTunnelForm` (form state, handlers, guards). */
export type UseTunnelFormReturn = {
  definitions: Record<string, TunnelEntry>;
  form: TunnelFormState;
  setForm: Dispatch<SetStateAction<TunnelFormState>>;
  editingName: string | null;
  showForm: boolean;
  setShowForm: Dispatch<SetStateAction<boolean>>;
  saving: boolean;
  error: string;
  fieldErrors: TunnelFormFieldErrors;
  saved: boolean;
  confirmRestartOpen: boolean;
  pendingUpdate: PendingTunnelUpdate | null;
  handleSubmit: () => Promise<void>;
  handleEdit: (name: string, entry: TunnelEntry) => void;
  handleDelete: (name: string) => Promise<void>;
  handleCancel: () => void;
  confirmRestart: () => Promise<void>;
  openRestartConfirm: (
    updated: Record<string, TunnelEntry>,
    closeForm: boolean,
  ) => void;
  handleAdd: () => void;
  dismissRestartConfirm: () => void;
  canEdit: boolean;
  actionDisabled: boolean;
  pendingHasTunnels: boolean;
  tunnelList: [string, TunnelEntry][];
};

/** Form state, validation, and save/delete flows for the Tunnels page (including restart confirm). */
export function useTunnelForm({
  running,
  setRunning,
  ngrokInstalled,
  hasAuthtoken,
}: UseTunnelFormParams): UseTunnelFormReturn {
  const { definitions, saveDefinitions } = useTunnels();

  const [form, setForm] = useState<TunnelFormState>(EMPTY_TUNNEL_FORM);
  const [editingName, setEditingName] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<TunnelFormFieldErrors>({});
  const [saved, setSaved] = useState(false);

  const [confirmRestartOpen, setConfirmRestartOpen] = useState(false);
  const [pendingUpdate, setPendingUpdate] =
    useState<PendingTunnelUpdate | null>(null);

  const canEdit = ngrokInstalled && hasAuthtoken;

  const savedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const tunnelList = useMemo(() => Object.entries(definitions), [definitions]);

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
    async (
      updated: Record<string, TunnelEntry>,
      closeForm: boolean,
      restartNgrok: boolean,
    ) => {
      setSaving(true);
      try {
        if (restartNgrok) {
          await invoke("stop_ngrok");
          await new Promise((r) => setTimeout(r, 1200));
        }

        await saveDefinitions(updated);

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
          setForm(EMPTY_TUNNEL_FORM);
          setShowForm(false);
          setEditingName(null);
        }
        return true;
      } catch (e: unknown) {
        if (restartNgrok) setRunning(false);
        setFieldErrors({});
        setError(
          toErrorString(e) ??
            (restartNgrok
              ? "Failed to update tunnels (ngrok restart)"
              : "Failed to save tunnels"),
        );
        return false;
      } finally {
        setSaving(false);
      }
    },
    [saveDefinitions, setRunning, triggerSaved],
  );

  const openRestartConfirm = useCallback(
    (updated: Record<string, TunnelEntry>, closeForm: boolean) => {
      setPendingUpdate({ updated, closeForm });
      setConfirmRestartOpen(true);
    },
    [],
  );

  const handleSubmit = async () => {
    const nameMissing = form.name.trim().length === 0;
    const addrMissing = form.addr.trim().length === 0;

    if (nameMissing || addrMissing) {
      setFieldErrors({ name: nameMissing, addr: addrMissing });
      if (nameMissing && addrMissing)
        setError("Tunnel name and local address are required");
      else if (nameMissing) setError("Tunnel name is required");
      else setError("Local address is required");
      return;
    }
    if (!canEdit) {
      setFieldErrors({});
      setError(
        !ngrokInstalled
          ? "Install ngrok first to add tunnels."
          : "Set your ngrok authtoken in Settings first.",
      );
      return;
    }

    setError("");
    setFieldErrors({});

    const nextName = form.name.trim();
    if (definitions[nextName] && nextName !== editingName) {
      setFieldErrors({ name: true });
      setError("A tunnel with this name already exists. Use a different name.");
      return;
    }

    const entry: TunnelEntry = {
      proto: form.proto,
      addr: form.addr.trim(),
      ...(form.host_header?.trim()
        ? { host_header: form.host_header.trim() }
        : {}),
    };

    const updated = { ...definitions };
    if (editingName && editingName !== nextName) delete updated[editingName];
    updated[nextName] = entry;

    if (running) {
      openRestartConfirm(updated, true);
      return;
    }

    await applyTunnelUpdate(updated, true, false);
  };

  const handleEdit = (name: string, entry: TunnelEntry) => {
    setForm({
      name,
      proto: entry.proto,
      addr: entry.addr,
      host_header: entry.host_header ?? "",
    });
    setEditingName(name);
    setShowForm(true);
    setError("");
    setFieldErrors({});
  };

  const handleDelete = async (name: string) => {
    if (!canEdit) {
      setError(
        !ngrokInstalled
          ? "Install ngrok first to edit tunnels."
          : "Set your ngrok authtoken in Settings first.",
      );
      return;
    }

    const updated = { ...definitions };
    delete updated[name];

    const shouldCloseForm = showForm && editingName === name;

    if (running) {
      openRestartConfirm(updated, shouldCloseForm);
      return;
    }

    await applyTunnelUpdate(updated, shouldCloseForm, false);
  };

  const handleCancel = () => {
    setForm(EMPTY_TUNNEL_FORM);
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

  const handleAdd = () => {
    setShowForm(true);
    setEditingName(null);
    setForm(EMPTY_TUNNEL_FORM);
  };

  const dismissRestartConfirm = () => {
    setConfirmRestartOpen(false);
    setPendingUpdate(null);
  };

  const actionDisabled = !canEdit || saving || confirmRestartOpen;
  const pendingHasTunnels = pendingUpdate
    ? Object.keys(pendingUpdate.updated).length > 0
    : true;

  return {
    definitions,
    form,
    setForm,
    editingName,
    showForm,
    setShowForm,
    saving,
    error,
    fieldErrors,
    saved,
    confirmRestartOpen,
    pendingUpdate,
    handleSubmit,
    handleEdit,
    handleDelete,
    handleCancel,
    confirmRestart,
    openRestartConfirm,
    handleAdd,
    dismissRestartConfirm,
    canEdit,
    actionDisabled,
    pendingHasTunnels,
    tunnelList,
  };
}
