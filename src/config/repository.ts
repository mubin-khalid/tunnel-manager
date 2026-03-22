/**
 * Canonical Git repository URL, injected at build time from `package.json` → `repository`
 * (see `vite.config.ts` `define`). Override for forks by changing `repository` and running
 * `node scripts/sync-repo-urls.mjs` for README/CHANGELOG badges.
 */
export const REPOSITORY_URL = import.meta.env.VITE_REPOSITORY_URL as string;

/** Releases page for the configured repository. */
export function repositoryReleasesUrl(): string {
  return `${REPOSITORY_URL}/releases`;
}
