/** One tunnel definition as stored in JSON and mirrored into generated `ngrok.yml`. */
export interface TunnelEntry {
  proto: string;
  addr: string;
  host_header?: string;
}
