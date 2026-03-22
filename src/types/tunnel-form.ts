import type { TunnelEntry } from "@/types/tunnels";

/** Values for the add/edit tunnel form on the Tunnels page. */
export type TunnelFormState = {
  name: string;
  proto: string;
  addr: string;
  host_header: string;
};

export const EMPTY_TUNNEL_FORM: TunnelFormState = {
  name: "",
  proto: "http",
  addr: "",
  host_header: "",
};

export type TunnelFormFieldErrors = Partial<Record<keyof TunnelFormState, boolean>>;

/** Pending save when ngrok is running and we must confirm restart. */
export type PendingTunnelUpdate = {
  updated: Record<string, TunnelEntry>;
  closeForm: boolean;
};
