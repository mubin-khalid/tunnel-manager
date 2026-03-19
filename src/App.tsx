import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import Dashboard from "./components/Dashboard";
import Tunnels from "./components/Tunnels";
import Settings from "./components/Settings";

type View = "dashboard" | "tunnels" | "settings";

export default function App() {
  const [view, setView] = useState<View>("dashboard");
  const [ngrokInstalled, setNgrokInstalled] = useState<boolean | null>(null);
  const [hasAuthtoken, setHasAuthtoken] = useState(false);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    invoke<boolean>("check_ngrok_installed").then(setNgrokInstalled);
  }, []);

  useEffect(() => {
    type AppSettings = { auto_start: boolean; authtoken?: string | null };
    invoke<AppSettings>("read_settings")
      .then((s) => setHasAuthtoken(!!s.authtoken && s.authtoken.trim().length > 0))
      .catch(() => setHasAuthtoken(false));
  }, []);

  useEffect(() => {
    if (view !== "tunnels" && view !== "dashboard") return;
    type AppSettings = { auto_start: boolean; authtoken?: string | null };
    invoke<AppSettings>("read_settings")
      .then((s) => setHasAuthtoken(!!s.authtoken && s.authtoken.trim().length > 0))
      .catch(() => setHasAuthtoken(false));
  }, [view]);

  useEffect(() => {
    const poll = setInterval(async () => {
      const status = await invoke<boolean>("ngrok_status");
      setRunning(status);
    }, 2000);
    return () => clearInterval(poll);
  }, []);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="w-sidebar min-w-sidebar bg-secondary border-r border-border flex flex-col pt-10">
        <div className="flex items-center justify-between px-4 pb-6">
          <div className="flex items-center gap-2">
            <span className="text-primary text-xl leading-none">⫸</span>
            <span className="font-mono text-[15px] font-semibold tracking-wide text-foreground">Tunnel Manager</span>
          </div>
          <div
            className={[
              "size-2 rounded-full transition-colors",
              running
                ? "bg-primary animate-pulse"
                : "bg-muted-foreground",
            ].join(" ")}
            title={running ? "Running" : "Stopped"}
          />
        </div>

        <nav className="flex flex-col gap-0.5 px-2 flex-1">
          {([
            { id: "dashboard", label: "Dashboard", icon: "◈" },
            { id: "tunnels",   label: "Tunnels",   icon: "⇄" },
            { id: "settings",  label: "Settings",  icon: "⚙" },
          ] as { id: View; label: string; icon: string }[]).map((item) => (
            <button
              key={item.id}
              className={[
                "w-full flex items-center gap-2.5 py-2 px-2.5 rounded text-[13px] transition-all duration-150 text-left font-normal",
                view === item.id
                  ? "bg-muted text-foreground font-medium"
                  : "bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground",
              ].join(" ")}
              onClick={() => setView(item.id)}
            >
              <span className={[
                "w-[18px] text-center text-[15px]",
                view === item.id ? "text-primary" : "",
              ].join(" ")}>
                {item.icon}
              </span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4">
          {ngrokInstalled === false && (
            <div className="flex items-center gap-1.5 text-[11px] text-chart-4 bg-chart-4/10 border border-chart-4/30 rounded px-2.5 py-2">
              <span>⚠</span> ngrok not found
            </div>
          )}
          {ngrokInstalled !== false && !hasAuthtoken && (
            <div className="flex items-center gap-1.5 text-[11px] text-chart-4 bg-chart-4/10 border border-chart-4/30 rounded px-2.5 py-2">
              <span>⚠</span> set your ngrok authtoken in Settings
            </div>
          )}
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto bg-background pt-10">
        {view === "dashboard" && (
          <Dashboard
            running={running}
            setRunning={setRunning}
            ngrokInstalled={!!ngrokInstalled}
            hasAuthtoken={hasAuthtoken}
          />
        )}
        {view === "tunnels" && (
          <Tunnels ngrokInstalled={!!ngrokInstalled} hasAuthtoken={hasAuthtoken} />
        )}
        {view === "settings" && <Settings />}
      </main>
    </div>
  );
}