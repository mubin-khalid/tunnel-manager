/** Page title for the settings view. */
export default function SettingsHeader() {
  return (
    <div className="mb-7">
      <h1 className="text-xl font-semibold text-foreground tracking-[-0.01em]">
        Settings
      </h1>
      <p className="text-[13px] text-muted-foreground mt-1">
        ngrok credentials and app preferences
      </p>
    </div>
  );
}
