type StatusDotVariant = "sidebar" | "row";

interface Props {
  running: boolean;
  variant: StatusDotVariant;
  className?: string;
  title?: string;
}

export default function StatusDot({
  running,
  variant,
  className,
  title,
}: Props) {
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
