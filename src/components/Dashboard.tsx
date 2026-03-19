import { useState, useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { DashboardTunnel } from "@/types";

interface Props {
  running: boolean;
  setRunning: (v: boolean) => void;
  ngrokInstalled: boolean;
  hasAuthtoken: boolean;
}

export default function Dashboard({ running, setRunning, ngrokInstalled, hasAuthtoken }: Props) {
  const [tunnels, setTunnels] = useState<DashboardTunnel[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  const fetchTunnels = useCallback(async () => {
    try {
      const data = await invoke<DashboardTunnel[]>("fetch_running_tunnels");
      setTunnels(data);
      setError("");
    } catch {
      setTunnels([]);
    }
  }, []);

  useEffect(() => {
    if (running) {
      fetchTunnels();
      const interval = setInterval(fetchTunnels, 3000);
      return () => clearInterval(interval);
    } else {
      setTunnels([]);
    }
  }, [running, fetchTunnels]);

  const handleStart = async () => {
    setLoading(true);
    setError("");
    try {
      await invoke("start_ngrok");
      setRunning(true);
      setTimeout(fetchTunnels, 1500);
    } catch (e: any) {
      setError(e?.toString() ?? "Failed to start ngrok");
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
    } catch (e: any) {
      setError(e?.toString() ?? "Failed to stop ngrok");
    } finally {
      setLoading(false);
    }
  };

  const copyUrl = async (url: string) => {
    await navigator.clipboard.writeText(url);
    setCopied(url);
    setTimeout(() => setCopied(null), 1800);
  };

  const displayTunnels = tunnels
    .filter(
      (t) =>
        t.proto === "https" ||
        !tunnels.find((x) => x.proto === "https" && x.config.addr === t.config.addr)
    )
    .slice()
    .sort((a, b) => a.public_url.localeCompare(b.public_url));

  return (
    <div className="w-full h-full p-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-7">
          <h1 className="text-xl font-semibold text-foreground tracking-[-0.01em]">Dashboard</h1>
          <p className="text-[13px] text-muted-foreground mt-1">Manage your active ngrok tunnels</p>
        </div>

        {/* Control bar */}
        <div className="flex items-center justify-between mb-5 bg-secondary border border-border rounded-md p-5">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span
                className={[
                  "w-2.5 h-2.5 rounded-full shrink-0",
                  running
                    ? "bg-primary shadow-[0_0_8px_#00d37f] animate-pulse"
                    : "bg-muted-foreground",
                ].join(" ")}
              />
              <span className={running
                ? "font-mono text-[13px] font-medium text-primary"
                : "font-mono text-[13px] font-medium text-muted-foreground"
              }>
                {running ? "Running" : "Stopped"}
              </span>
            </div>
            {running && tunnels.length > 0 && (
              <span className="inline-flex items-center px-2 py-px rounded-[3px] font-mono text-[11px] font-medium bg-primary/10 text-primary">
                {displayTunnels.length} tunnel{displayTunnels.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>
          <div className="flex gap-2">
            {!running ? (
              <button
                className="bg-primary text-[#00110b] font-semibold text-[13px] px-4 py-2 rounded-md tracking-[0.02em] hover:bg-primary-dark disabled:bg-border2 disabled:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-85 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30 transition-colors duration-150"
                onClick={handleStart}
                disabled={loading || !ngrokInstalled || !hasAuthtoken}
              >
                {loading ? "Starting…" : "▶  Start ngrok"}
              </button>
            ) : (
              <button
                className="bg-transparent text-muted-foreground text-[13px] px-[14px] py-2 rounded-md border border-border hover:bg-muted hover:text-foreground hover:border-border2 disabled:cursor-not-allowed disabled:opacity-70 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30 transition-colors duration-150"
                onClick={handleStop}
                disabled={loading}
              >
                {loading ? "Stopping…" : "■  Stop"}
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-danger rounded-md px-[14px] py-[10px] text-[13px] mb-3.5">
            {error}
          </div>
        )}

        {!ngrokInstalled && (
          <div className="bg-amber-500/10 border border-amber-500/30 text-warning rounded-md px-[14px] py-[10px] text-[13px] mb-3.5">
            ngrok is not installed or not in PATH. Install it from{" "}
            <a href="https://ngrok.com/download" target="_blank" rel="noreferrer">
              ngrok.com/download
            </a>
          </div>
        )}

        {/* Tunnel list */}
        {running && displayTunnels.length === 0 && (
          <div className="text-center py-16 px-5 text-muted-foreground">
            <span className="text-[32px] block mb-3 opacity-40">⧖</span>
            <p>Waiting for tunnels…</p>
            <p className="text-[12px] mt-1 opacity-60">Make sure tunnels are defined in your config</p>
          </div>
        )}

        {displayTunnels.map((tunnel) => (
          <div
            key={`${tunnel.proto}:${tunnel.public_url}`}
            className="bg-secondary border border-border rounded-md p-5 mb-2.5 transition-colors hover:border-border2"
          >
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-2.5">
                <span className="inline-flex items-center px-2 py-px rounded-[3px] font-mono text-[11px] font-medium bg-primary/10 text-primary">
                  {tunnel.proto.toUpperCase()}
                </span>
                <span className="font-mono text-[12px] text-muted-foreground">→ {tunnel.config.addr}</span>
              </div>
            </div>
            <div className="flex items-center gap-2.5 bg-muted border border-border rounded-md px-[14px] py-[10px]">
              <code className="font-mono text-[13px] text-foreground flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
                {tunnel.public_url}
              </code>
              <button
                className={[
                  "bg-border text-muted-foreground text-[11px] font-mono font-medium px-2.5 py-1 rounded shrink-0 transition-colors hover:bg-border2 hover:text-foreground",
                  copied === tunnel.public_url
                    ? "bg-primary/20 text-primary hover:bg-primary/20"
                    : "",
                ].join(" ")}
                onClick={() => copyUrl(tunnel.public_url)}
                title="Copy URL"
              >
                {copied === tunnel.public_url ? "✓ Copied" : "Copy"}
              </button>
            </div>
          </div>
        ))}

        {!running && (
          <div className="text-center py-16 px-5 text-muted-foreground">
            <span className="text-[32px] block mb-3 opacity-40">⫸</span>
            <p>No active tunnels</p>
            <p className="text-[12px] mt-1 opacity-60">Start ngrok to expose your local servers</p>
          </div>
        )}
      </div>
    </div>
  );
}