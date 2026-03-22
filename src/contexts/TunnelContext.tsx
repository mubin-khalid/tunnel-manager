import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { TunnelEntry } from "@/types";

interface TunnelContextValue {
  definitions: Record<string, TunnelEntry>;
  enabledTunnels: string[];
  loading: boolean;
  refresh: () => Promise<void>;
  toggleTunnel: (name: string) => Promise<void>;
  saveDefinitions: (updated: Record<string, TunnelEntry>) => Promise<void>;
}

const TunnelContext = createContext<TunnelContextValue | null>(null);

export function TunnelProvider({ children }: { children: React.ReactNode }) {
  const [definitions, setDefinitions] = useState<Record<string, TunnelEntry>>({});
  const [enabledTunnels, setEnabledTunnels] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const [defs, settings] = await Promise.all([
        invoke<Record<string, TunnelEntry>>("get_tunnel_definitions"),
        invoke<{ auto_start: boolean; authtoken?: string | null; enabled_tunnels?: string[] }>("read_settings"),
      ]);
      setDefinitions(defs ?? {});
      setEnabledTunnels(settings.enabled_tunnels ?? []);
    } catch {
      setDefinitions({});
      setEnabledTunnels([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const toggleTunnel = useCallback(async (name: string) => {
    const settings = await invoke<{ auto_start: boolean; authtoken?: string | null; enabled_tunnels?: string[] }>("read_settings");
    const current = settings.enabled_tunnels ?? [];
    const next = current.includes(name)
      ? current.filter((n) => n !== name)
      : [...current, name];
    await invoke("write_settings", { settings: { ...settings, enabled_tunnels: next } });
    setEnabledTunnels(next);
  }, []);

  const saveDefinitions = useCallback(async (updated: Record<string, TunnelEntry>) => {
    await invoke("update_tunnel_definitions", { tunnels: updated });
    // Remove any enabled_tunnels entries that no longer exist
    const settings = await invoke<{ auto_start: boolean; authtoken?: string | null; enabled_tunnels?: string[] }>("read_settings");
    const cleaned = (settings.enabled_tunnels ?? []).filter((n) => n in updated);
    await invoke("write_settings", { settings: { ...settings, enabled_tunnels: cleaned } });
    setDefinitions(updated);
    setEnabledTunnels(cleaned);
  }, []);

  return (
    <TunnelContext.Provider value={{ definitions, enabledTunnels, loading, refresh, toggleTunnel, saveDefinitions }}>
      {children}
    </TunnelContext.Provider>
  );
}

/* eslint-disable react-refresh/only-export-components */
export function useTunnels() {
  const context = useContext(TunnelContext);
  if (!context) throw new Error("useTunnels must be used within TunnelProvider");
  return context;
}
