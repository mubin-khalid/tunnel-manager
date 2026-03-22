/**
 * Central export surface for page-level composition.
 * Prefer importing from `@/components` in `src/pages/*`.
 */

export { default as ConfirmModal } from "@/components/ui/ConfirmModal";
export { default as FormField } from "@/components/ui/FormField";
export { default as StatusDot } from "@/components/ui/StatusDot";

// Tunnels
export { default as TunnelsAuthWarningCard } from "@/components/tunnels/TunnelsAuthWarningCard";
export { default as TunnelsEmptyState } from "@/components/tunnels/TunnelsEmptyState";
export { default as TunnelsFormCard } from "@/components/tunnels/TunnelsFormCard";
export { default as TunnelsHeader } from "@/components/tunnels/TunnelsHeader";
export { default as TunnelsList } from "@/components/tunnels/TunnelsList";

// Dashboard
export { default as DashboardHeader } from "@/components/dashboard/DashboardHeader";
export { default as DashboardControlBar } from "@/components/dashboard/DashboardControlBar";
export { default as DashboardActiveTunnelsCard } from "@/components/dashboard/DashboardActiveTunnelsCard";
export { default as DashboardEmptyState } from "@/components/dashboard/DashboardEmptyState";
export { default as DashboardWaitingState } from "@/components/dashboard/DashboardWaitingState";
export { default as DashboardAuthWarningCard } from "@/components/dashboard/DashboardAuthWarningCard";
export type { DashboardTunnelViewModel } from "@/types/dashboard";

// Settings
export { default as SettingsHeader } from "@/components/settings/SettingsHeader";
export { default as SettingsErrorBanner } from "@/components/settings/SettingsErrorBanner";
export { default as AuthtokenCard } from "@/components/settings/AuthtokenCard";
export { default as PreferencesCard } from "@/components/settings/PreferencesCard";
export { default as SaveRow } from "@/components/settings/SaveRow";
