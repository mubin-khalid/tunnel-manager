import type { TunnelEntry } from "@/types/tunnels";

/** React context value: tunnel definitions JSON + enabled names + Tauri sync helpers. */
export interface TunnelContextValue {
  definitions: Record<string, TunnelEntry>;
  enabledTunnels: string[];
  loading: boolean;
  refresh: () => Promise<void>;
  toggleTunnel: (name: string) => Promise<void>;
  saveDefinitions: (updated: Record<string, TunnelEntry>) => Promise<void>;
}
