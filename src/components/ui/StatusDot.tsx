import type { StatusDotProps } from "@/types/component-props";

/** Small traffic-light indicator for whether ngrok is running (sidebar or table row). */
export default function StatusDot({
  running,
  variant,
  className,
  title,
}: StatusDotProps) {
  const base =
    variant === "sidebar"
      ? "size-2 rounded-full transition-colors"
      : "w-2 h-2 rounded-full";

  const status =
    variant === "sidebar"
      ? running
        ? "bg-primary animate-pulse"
        : "bg-muted-foreground"
      : running
        ? "bg-primary shadow-[0_0_0_4px_rgba(0,211,127,0.25)]"
        : "bg-muted-foreground shadow-none opacity-90";

  return (
    <span
      className={[base, status, className].filter(Boolean).join(" ")}
      title={title}
      aria-hidden="true"
    />
  );
}
