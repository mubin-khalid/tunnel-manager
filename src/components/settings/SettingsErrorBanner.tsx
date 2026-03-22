import type { SettingsErrorBannerProps } from "@/types/component-props";

/** Dismissible error strip for failed save/load of settings. */
export default function SettingsErrorBanner({ error }: SettingsErrorBannerProps) {
  if (!error) return null;
  return (
    <div
      className="bg-red-500/10 border border-red-500/30 text-danger rounded-md px-3.5 py-2.5 text-[13px] mb-4"
      role="alert"
    >
      {error}
    </div>
  );
}
