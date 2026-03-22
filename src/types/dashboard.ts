/** One tunnel entry returned from the ngrok local API (`/api/tunnels`). */
export interface DashboardTunnel {
  proto: string;
  public_url: string;
  config: { addr: string };
}

/** View model for one row on the dashboard (resolved name, proto, URLs). */
export type DashboardTunnelViewModel = {
  key: string;
  name: string;
  proto: string;
  configAddr: string;
  publicUrl: string;
};
