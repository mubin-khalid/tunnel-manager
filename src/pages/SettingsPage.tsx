import { useEffect, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { AppSettings } from "@/types";
import { toErrorString } from "@/utils/error";
import { AuthtokenCard, PreferencesCard, SaveRow, SettingsErrorBanner, SettingsHeader } from "@/components";

export default function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings>({ auto_start: false });
  const [authtoken, setAuthtoken] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const savedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  useEffect(() => {
    return () => {
      if (savedTimeoutRef.current) clearTimeout(savedTimeoutRef.current);
    };
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      const token = authtoken.trim();
      if (!token) {
        setError("Please enter your ngrok authtoken first.");
        setSaved(false);
        return;
      }

      const updatedSettings: AppSettings = { ...settings, authtoken: token };
      await invoke("write_settings", { settings: updatedSettings });
      setSaved(true);
      if (savedTimeoutRef.current) clearTimeout(savedTimeoutRef.current);
      savedTimeoutRef.current = setTimeout(() => setSaved(false), 2500);
    } catch (e: unknown) {
      setError(toErrorString(e) ?? "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full h-full p-8">
      <div className="max-w-3xl mx-auto">
        <SettingsHeader />
        <SettingsErrorBanner error={error} />

        <AuthtokenCard
          showToken={showToken}
          onToggleShowToken={() => setShowToken((v) => !v)}
          authtoken={authtoken}
          onChangeAuthtoken={setAuthtoken}
        />

        <PreferencesCard
          autoStart={settings.auto_start}
          onToggle={() => setSettings({ ...settings, auto_start: !settings.auto_start })}
        />

        <SaveRow saved={saved} saving={saving} onSave={handleSave} />
      </div>
    </div>
  );
}

