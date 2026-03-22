/** Shared domain types for the React app (tunnels, dashboard, settings). */
export type { TunnelEntry } from "@/types/tunnels";
export type {
  DashboardTunnel,
  DashboardTunnelViewModel,
} from "@/types/dashboard";
export type { AppSettings } from "@/types/settings";
export type { AppView } from "@/types/navigation";
export type { DashboardPageProps, TunnelsPageProps } from "@/types/pages";
export type {
  TunnelFormState,
  TunnelFormFieldErrors,
  PendingTunnelUpdate,
} from "@/types/tunnel-form";
export { EMPTY_TUNNEL_FORM } from "@/types/tunnel-form";
export type { TunnelContextValue } from "@/types/tunnel-context";
export type {
  StatusDotVariant,
  StatusDotProps,
  FormFieldProps,
  ConfirmModalProps,
  DashboardControlBarProps,
  DashboardAuthWarningCardProps,
  DashboardActiveTunnelsCardProps,
  DashboardTunnelRowProps,
  TunnelsHeaderProps,
  TunnelsListProps,
  TunnelRowProps,
  TunnelsFormCardProps,
  TunnelsAuthWarningCardProps,
  SettingsErrorBannerProps,
  SaveRowProps,
  PreferencesCardProps,
  AuthtokenCardProps,
} from "@/types/component-props";
