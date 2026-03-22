/** Props for the dashboard route (start/stop ngrok and list active tunnels). */
export type DashboardPageProps = {
  running: boolean;
  setRunning: (v: boolean) => void;
  ngrokInstalled: boolean;
  hasAuthtoken: boolean;
};

/** Props for the tunnels CRUD route. */
export type TunnelsPageProps = {
  ngrokInstalled: boolean;
  hasAuthtoken: boolean;
  running: boolean;
  setRunning: (v: boolean) => void;
};
