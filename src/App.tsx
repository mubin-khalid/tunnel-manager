import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import {
  AlertTriangle,
  LayoutDashboard,
  Network,
  Settings as SettingsIcon,
} from "lucide-react";
import TunnelsPage from "@/pages/TunnelsPage";
import DashboardPage from "@/pages/DashboardPage";
import SettingsPage from "@/pages/SettingsPage";
import StatusDot from "@/components/ui/StatusDot";
import logoUrl from "@/../src-tauri/icons/32x32.png";
import { TunnelProvider } from "@/contexts/TunnelContext";
import type { AppView } from "@/types/navigation";
import { repositoryReleasesUrl } from "@/config/repository";

/** Root shell: sidebar navigation, global ngrok status, and page content inside `TunnelProvider`. */
export default function App() {
  const [view, setView] = useState<AppView>("dashboard");
  const [ngrokInstalled, setNgrokInstalled] = useState<boolean | null>(null);
  const [hasAuthtoken, setHasAuthtoken] = useState(false);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    invoke<boolean>("check_ngrok_installed").then(setNgrokInstalled);
  }, []);

  useEffect(() => {
    type AppSettings = { auto_start: boolean; authtoken?: string | null };
    invoke<AppSettings>("read_settings")
      .then((s) =>
        setHasAuthtoken(!!s.authtoken && s.authtoken.trim().length > 0),
      )
      .catch(() => setHasAuthtoken(false));
  }, []);

  useEffect(() => {
    if (view !== "tunnels" && view !== "dashboard") return;
    type AppSettings = { auto_start: boolean; authtoken?: string | null };
    invoke<AppSettings>("read_settings")
      .then((s) =>
        setHasAuthtoken(!!s.authtoken && s.authtoken.trim().length > 0),
      )
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
    <TunnelProvider>
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar */}
        <aside className="w-sidebar min-w-sidebar bg-secondary border-r border-border flex flex-col pt-10">
          <div className="flex items-center justify-between px-4 pb-6">
            <div className="flex items-center gap-2">
              <img
                src={logoUrl}
                alt="Tunnel Manager logo"
                className="w-5 h-5"
              />
              <span className="font-mono text-[15px] font-semibold tracking-wide text-foreground">
                Tunnel Manager
              </span>
            </div>
            <StatusDot
              running={running}
              variant="sidebar"
              title={running ? "Running" : "Stopped"}
            />
          </div>

          <nav className="flex flex-col gap-0.5 px-2 flex-1">
            {(
              [
                { id: "dashboard", label: "Dashboard", Icon: LayoutDashboard },
                { id: "tunnels", label: "Tunnels", Icon: Network },
                { id: "settings", label: "Settings", Icon: SettingsIcon },
              ] as { id: AppView; label: string; Icon: typeof LayoutDashboard }[]
            ).map((item) => (
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
                <span
                  className={[
                    "w-[18px] text-center text-[15px]",
                    view === item.id ? "text-primary" : "",
                  ].join(" ")}
                >
                  <item.Icon size={16} />
                </span>
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          <div className="p-4 flex flex-col gap-3">
            {ngrokInstalled === false && (
              <div className="flex items-center gap-1.5 text-[11px] text-chart-4 bg-chart-4/10 border border-chart-4/30 rounded px-2.5 py-2">
                <AlertTriangle size={14} />
                <span>ngrok not found</span>
              </div>
            )}
            {ngrokInstalled !== false && !hasAuthtoken && (
              <div className="flex items-center gap-1.5 text-[11px] text-chart-4 bg-chart-4/10 border border-chart-4/30 rounded px-2.5 py-2">
                <AlertTriangle size={14} />
                <span>set your ngrok authtoken in Settings</span>
              </div>
            )}

            <div className="mt-auto text-[11px] font-mono text-muted-foreground/70">
              App Version:{" "}
              <a
                href={repositoryReleasesUrl()}
                target="_blank"
                rel="noreferrer"
                className="font-medium hover:underline"
              >
                v-{import.meta.env.VITE_APP_VERSION}
              </a>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto bg-background pt-10">
          {view === "dashboard" && (
            <DashboardPage
              running={running}
              setRunning={setRunning}
              ngrokInstalled={!!ngrokInstalled}
              hasAuthtoken={hasAuthtoken}
            />
          )}
          {view === "tunnels" && (
            <TunnelsPage
              ngrokInstalled={!!ngrokInstalled}
              hasAuthtoken={hasAuthtoken}
              running={running}
              setRunning={setRunning}
            />
          )}
          {view === "settings" && <SettingsPage />}
        </main>
      </div>
    </TunnelProvider>
  );
}
