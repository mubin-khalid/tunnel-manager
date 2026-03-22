/** Returns the host part of a URL or bare hostname (no scheme, no path). */
export function stripUrl(url: string): string {
  const trimmed = url.trim();
  return trimmed
    .replace(/^https?:\/\//i, "")
    .split("/")[0]
    .trim();
}

/** Uppercases the first Unicode code unit; empty string stays empty. */
export function capitalize(s: string): string {
  return s.length ? s[0].toUpperCase() + s.slice(1) : s;
}

/** Lowercases and returns hostname only (strips scheme, port, and path). */
export function normalizeHost(h: string): string {
  return h
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//i, "")
    .split("/")[0]
    .split(":")[0]
    .trim();
}

/** Parses ngrok `addr` values: host or `host:port`, lowercased, no path. */
export function normalizeAddr(addr: string): string {
  const a = addr.trim();
  const withoutScheme = a.replace(/^[a-z]+:\/\//i, "");
  const hostPort = withoutScheme.split("/")[0].toLowerCase();
  return hostPort.split(":")[0].trim();
}

/** Human-readable label from a tunnel public URL (title-cased hyphenated subdomain). */
export function formatTunnelName(publicUrl: string): string {
  const host = stripUrl(publicUrl);
  const base = host.split(".")[0] ?? host;
  const withoutAppSuffix = base.replace(/-app$/i, "");
  return withoutAppSuffix
    .split("-")
    .filter(Boolean)
    .map((segment) => capitalize(segment.toLowerCase()))
    .join(" ");
}
