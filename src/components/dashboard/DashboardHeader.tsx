/** Page title for the dashboard view. */
export default function DashboardHeader() {
  return (
    <div className="mb-7">
      <h1 className="text-xl font-semibold text-foreground tracking-[-0.01em]">
        Dashboard
      </h1>
      <p className="text-[13px] text-muted-foreground mt-1">
        Manage your active ngrok tunnels
      </p>
    </div>
  );
}
