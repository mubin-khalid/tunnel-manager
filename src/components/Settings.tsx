import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { AppSettings } from "@/types";

const inputClass =
  "w-full bg-muted border border-border text-foreground font-mono text-[13px] rounded-md px-3 py-2 outline-none transition-colors duration-150 focus:border-primary placeholder:text-muted-foreground/40";

export default function Settings() {
  const [settings, setSettings] = useState<AppSettings>({ auto_start: false });
  const [authtoken, setAuthtoken] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    invoke<AppSettings>("read_settings")
      .then((s) => {
        setSettings(s);
        setAuthtoken(s.authtoken ?? "");
      })
      .catch(() => {
        setSettings({ auto_start: false, authtoken: null });
        setAuthtoken("");
      });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      const token = authtoken.trim();
      if (!token) {
        setError("Please enter your ngrok authtoken first.");
        return;
      }
      const updatedSettings: AppSettings = { ...settings, authtoken: token };
      await invoke("write_settings", { settings: updatedSettings });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e: any) {
      setError(e?.toString() ?? "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full h-full p-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-7">
          <h1 className="text-xl font-semibold text-foreground tracking-[-0.01em]">
            Settings
          </h1>
          <p className="text-[13px] text-muted-foreground mt-1">
            ngrok credentials and app preferences
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-danger rounded-md px-3.5 py-2.5 text-[13px] mb-4">
            {error}
          </div>
        )}

        {/* Authtoken card */}
        <div className="bg-secondary border border-border rounded-md mb-3">
          <div className="px-5 pt-5 pb-4">
            <div className="text-[13px] font-semibold text-foreground">
              ngrok Authtoken
            </div>
            <p className="text-[12px] text-muted-foreground mt-0.5">
              Find your Authtoken at&nbsp;
              <a
                href="https://dashboard.ngrok.com/get-started/your-authtoken"
                target="_blank"
                rel="noreferrer"
                className="text-primary hover:underline"
              >
                NGROK Dashboard
              </a>
            </p>
          </div>
          <div className="h-px bg-border" />
          <div className="px-5 pt-4 pb-5">
            <label className="text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground mb-1.5 block">
              Authtoken
            </label>
            <div className="flex gap-2 items-center">
              <input
                type={showToken ? "text" : "password"}
                value={authtoken}
                onChange={(e) => setAuthtoken(e.target.value)}
                placeholder="2abc123…"
                className={inputClass}
              />
              <button
                className="bg-transparent text-muted-foreground text-[12px] px-3.5 py-2 rounded-md border border-border hover:bg-muted hover:text-foreground hover:border-border2 shrink-0 transition-colors duration-150"
                onClick={() => setShowToken(!showToken)}
              >
                {showToken ? "Hide" : "Show"}
              </button>
            </div>
          </div>
        </div>

        {/* Preferences card */}
        <div className="bg-secondary border border-border rounded-md mb-4">
          <div className="px-5 pt-5 pb-4">
            <div className="text-[13px] font-semibold text-foreground">
              Preferences
            </div>
          </div>
          <div className="h-px bg-border" />
          <div className="px-5 py-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <span className="text-[13px] text-foreground block mb-0.5">
                  Auto-start ngrok on launch
                </span>
                <span className="text-[12px] text-muted-foreground">
                  Automatically run{" "}
                  <code className="font-mono text-[11px] bg-muted border border-border rounded px-1.5 py-px">
                    ngrok start --all
                  </code>{" "}
                  when the app opens
                </span>
              </div>
              <button
                className={[
                  "w-11 h-6 rounded-full relative shrink-0 transition-colors duration-200 cursor-pointer border-none outline-none",
                  settings.auto_start ? "bg-primary" : "bg-border2",
                ].join(" ")}
                onClick={() =>
                  setSettings({ ...settings, auto_start: !settings.auto_start })
                }
                role="switch"
                aria-checked={settings.auto_start}
              >
                <span
                  className={[
                    "absolute top-[4px] w-4 h-4 rounded-full bg-white transition-[left] duration-200",
                    settings.auto_start ? "left-[22px]" : "left-[4px]",
                  ].join(" ")}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Save row */}
        <div className="flex items-center justify-end gap-3">
          {saved && (
            <span className="text-[12px] text-primary font-mono animate-fadein">
              ✓ Settings saved
            </span>
          )}
          <button
            className="bg-primary text-[#00110b] font-semibold text-[13px] px-4 py-2 rounded-md tracking-[0.02em] hover:bg-primary-dark disabled:bg-border2 disabled:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-85 transition-colors duration-150"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "Saving…" : "Save Settings"}
          </button>
        </div>
      </div>
    </div>
  );
}
