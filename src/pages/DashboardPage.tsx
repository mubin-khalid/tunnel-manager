import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { openUrl } from "@tauri-apps/plugin-opener";
import type {
  DashboardTunnel,
  DashboardTunnelViewModel,
  TunnelEntry,
} from "@/types";
import {
  DashboardHeader,
  DashboardControlBar,
  DashboardActiveTunnelsCard,
  DashboardEmptyState,
  DashboardWaitingState,
  DashboardAuthWarningCard,
} from "@/components";
import { toErrorString } from "@/utils/error";
import { formatTunnelName, normalizeAddr, normalizeHost } from "@/utils/tunnel";
import type { DashboardPageProps } from "@/types/pages";

export type { DashboardPageProps };

/** Polls the local ngrok API, shows public URLs, and controls the managed ngrok process. */
export default function DashboardPage({
  running,
  setRunning,
  ngrokInstalled,
  hasAuthtoken,
}: DashboardPageProps) {
  const [tunnels, setTunnels] = useState<DashboardTunnel[]>([]);
  const [savedTunnels, setSavedTunnels] = useState<Record<string, TunnelEntry>>(
    {},
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  const copiedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchTunnels = useCallback(async () => {
    try {
      const data = await invoke<DashboardTunnel[]>("fetch_running_tunnels");
      setTunnels(data);
      setError("");
    } catch {
      setTunnels([]);
    }
  }, []);

  // Only keep enabled tunnel definitions — used for the "no tunnels" guard
  // and for resolving display names on the dashboard.
  const fetchSavedTunnels = useCallback(async () => {
    try {
      const [defs, settings] = await Promise.all([
        invoke<Record<string, TunnelEntry>>("get_tunnel_definitions"),
        invoke<{ enabled_tunnels?: string[] }>("read_settings"),
      ]);
      const enabled = settings.enabled_tunnels ?? [];
      const enabledDefs = Object.fromEntries(
        Object.entries(defs ?? {}).filter(([name]) => enabled.includes(name)),
      );
      setSavedTunnels(enabledDefs);
    } catch {
      setSavedTunnels({});
    }
  }, []);

  useEffect(() => {
    return () => {
      if (copiedTimeoutRef.current) clearTimeout(copiedTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    fetchSavedTunnels();
  }, [fetchSavedTunnels]);

  useEffect(() => {
    if (running) {
      fetchTunnels();
      const interval = setInterval(fetchTunnels, 3000);
      return () => clearInterval(interval);
    }
    setTunnels([]);
    setCopied(null);
  }, [running, fetchTunnels]);

  const handleStart = async () => {
    setLoading(true);
    setError("");
    try {
      await invoke("start_ngrok");
      setRunning(true);
      setTimeout(fetchTunnels, 1500);
    } catch (e: unknown) {
      setError(toErrorString(e) ?? "Failed to start ngrok");
    } finally {
      setLoading(false);
    }
  };

  const handleStop = async () => {
    setLoading(true);
    try {
      await invoke("stop_ngrok");
      setRunning(false);
      setTunnels([]);
    } catch (e: unknown) {
      setError(toErrorString(e) ?? "Failed to stop ngrok");
    } finally {
      setLoading(false);
    }
  };

  const copyUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(url);
      if (copiedTimeoutRef.current) clearTimeout(copiedTimeoutRef.current);
      copiedTimeoutRef.current = setTimeout(() => setCopied(null), 1800);
    } catch {
      setError("Failed to copy URL (clipboard permission denied).");
    }
  };

  const openTunnelUrl = useCallback(async (url: string) => {
    try {
      await openUrl(url);
      setError("");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg || "Failed to open URL in browser.");
    }
  }, []);

  const displayTunnels = useMemo(() => {
    return tunnels
      .filter(
        (t) =>
          t.proto === "https" ||
          !tunnels.find(
            (x) => x.proto === "https" && x.config.addr === t.config.addr,
          ),
      )
      .slice()
      .sort((a, b) => a.public_url.localeCompare(b.public_url));
  }, [tunnels]);

  const items: DashboardTunnelViewModel[] = useMemo(() => {
    const resolveName = (t: DashboardTunnel) => {
      const destinationHost = normalizeAddr(t.config.addr);
      const tProto = t.proto.toLowerCase();

      const isWeb = tProto === "https" || tProto === "http";
      const isTcp = tProto === "tcp";

      const fallback = formatTunnelName(t.public_url);

      for (const [name, entry] of Object.entries(savedTunnels)) {
        const entryProto = (entry.proto ?? "").toLowerCase();
        if (isTcp && entryProto !== "tcp") continue;
        if (isWeb && entryProto !== "http" && entryProto !== "tls") continue;

        if (normalizeAddr(entry.addr) !== destinationHost) continue;

        if (entry.host_header?.trim()) {
          if (normalizeHost(entry.host_header) !== destinationHost) continue;
        }

        return name;
      }

      return fallback;
    };

    return displayTunnels.map((t) => ({
      key: t.public_url,
      name: resolveName(t),
      proto: t.proto,
      configAddr: t.config.addr,
      publicUrl: t.public_url,
    }));
  }, [displayTunnels, savedTunnels]);

  const hasEnabledTunnels = Object.keys(savedTunnels).length > 0;

  return (
    <div className="w-full h-full p-8">
      <div className="max-w-3xl mx-auto">
        <DashboardHeader />
        <DashboardAuthWarningCard
          ngrokInstalled={ngrokInstalled}
          hasAuthtoken={hasAuthtoken}
        />

        {error && (
          <div
            className="bg-red-500/10 border border-red-500/30 text-danger rounded-md px-3.5 py-2.5 text-[13px] mb-4"
            role="alert"
          >
            {error}
          </div>
        )}

        <DashboardControlBar
          running={running}
          loading={loading}
          ngrokInstalled={ngrokInstalled}
          hasAuthtoken={hasAuthtoken}
          tunnelCount={items.length}
          onStart={handleStart}
          onStop={handleStop}
        />

        {running && items.length > 0 && (
          <DashboardActiveTunnelsCard
            items={items}
            running={running}
            copiedUrl={copied}
            disabled={false}
            onCopy={copyUrl}
            onOpen={openTunnelUrl}
          />
        )}

        {running && items.length === 0 && <DashboardWaitingState />}

        {!running && !hasEnabledTunnels && <DashboardEmptyState />}
      </div>
    </div>
  );
}
