export function stripUrl(url: string): string {
  return url
    .replace(/^https?:\/\//i, "")
    .split("/")[0]
    .trim();
}

export function capitalize(s: string): string {
  return s.length ? s[0].toUpperCase() + s.slice(1) : s;
}

export function normalizeHost(h: string): string {
  return h
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//i, "")
    .split("/")[0]
    .split(":")[0]
    .trim();
}

export function normalizeAddr(addr: string): string {
  const a = addr.trim();
  const withoutScheme = a.replace(/^[a-z]+:\/\//i, "");
  const hostPort = withoutScheme.split("/")[0].toLowerCase();
  return hostPort.split(":")[0].trim();
}

export function formatTunnelName(publicUrl: string): string {
  const host = stripUrl(publicUrl);
  const base = host.split(".")[0] ?? host;
  const withoutAppSuffix = base.replace(/-app$/i, "");
  return withoutAppSuffix
    .split("-")
    .filter(Boolean)
    .map(capitalize)
    .join(" ");
}
