import type { ReactNode } from "react";
import type { DashboardTunnelViewModel } from "@/types/dashboard";
import type { TunnelFormState, TunnelFormFieldErrors } from "@/types/tunnel-form";
import type { TunnelEntry } from "@/types/tunnels";

// ---------------------------------------------------------------------------
// UI
// ---------------------------------------------------------------------------

export type StatusDotVariant = "sidebar" | "row";

export interface StatusDotProps {
  running: boolean;
  variant: StatusDotVariant;
  className?: string;
  title?: string;
}

export interface FormFieldProps {
  label: string;
  hint?: ReactNode;
  children: ReactNode;
}

export interface ConfirmModalProps {
  open: boolean;
  title: string;
  message: ReactNode;
  confirmText: string;
  cancelText?: string;
  danger?: boolean;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

export interface DashboardControlBarProps {
  running: boolean;
  loading: boolean;
  ngrokInstalled: boolean;
  hasAuthtoken: boolean;
  tunnelCount: number;
  onStart: () => void;
  onStop: () => void;
}

export interface DashboardAuthWarningCardProps {
  ngrokInstalled: boolean;
  hasAuthtoken: boolean;
}

export interface DashboardActiveTunnelsCardProps {
  items: DashboardTunnelViewModel[];
  copiedUrl: string | null;
  running: boolean;
  disabled: boolean;
  onCopy: (publicUrl: string) => void;
  onOpen: (publicUrl: string) => void;
}

export interface DashboardTunnelRowProps {
  item: DashboardTunnelViewModel;
  running: boolean;
  copiedUrl: string | null;
  disabled: boolean;
  onCopy: (publicUrl: string) => void;
  onOpen: (publicUrl: string) => void;
}

// ---------------------------------------------------------------------------
// Tunnels
// ---------------------------------------------------------------------------

export interface TunnelsHeaderProps {
  showForm: boolean;
  saved: boolean;
  canEdit: boolean;
  ngrokInstalled: boolean;
  actionDisabled: boolean;
  onAdd: () => void;
}

export interface TunnelsListProps {
  tunnels: Record<string, TunnelEntry>;
  disabled: boolean;
  running: boolean;
  onEdit: (name: string, entry: TunnelEntry) => void;
  onDelete: (name: string) => void;
}

export interface TunnelRowProps {
  name: string;
  entry: TunnelEntry;
  disabled: boolean;
  running: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

export interface TunnelsFormCardProps {
  showForm: boolean;
  editingName: string | null;
  form: TunnelFormState;
  error: string;
  fieldErrors: TunnelFormFieldErrors;
  saving: boolean;
  actionDisabled: boolean;
  onChange: (next: TunnelFormState) => void;
  onCancel: () => void;
  onSubmit: () => void;
}

export interface TunnelsAuthWarningCardProps {
  ngrokInstalled: boolean;
}

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

export interface SettingsErrorBannerProps {
  error: string;
}

export interface SaveRowProps {
  saved: boolean;
  saving: boolean;
  onSave: () => void;
}

export interface PreferencesCardProps {
  autoStart: boolean;
  onToggle: () => void;
}

export interface AuthtokenCardProps {
  showToken: boolean;
  onToggleShowToken: () => void;
  authtoken: string;
  onChangeAuthtoken: (v: string) => void;
}
