/**
 * Shared helpers for resolving the canonical GitHub repository URL from package.json.
 * Used by Vite (runtime `import.meta.env`) and `sync-repo-urls.mjs` (README/CHANGELOG).
 *
 * @param {Record<string, unknown>} packageJson — parsed package.json
 * @returns {string} HTTPS base URL without trailing slash (e.g. https://github.com/org/repo)
 */
export function getRepositoryBaseUrl(packageJson) {
  const r = packageJson.repository;
  const url = typeof r === "string" ? r : r?.url;
  if (!url || typeof url !== "string") {
    return "https://github.com/mubin-khalid/tunnel-manager";
  }
  return url
    .replace(/^git\+/, "")
    .replace(/\.git$/, "")
    .replace(/\/$/, "");
}

/**
 * @param {string} baseUrl — from {@link getRepositoryBaseUrl}
 * @returns {{ owner: string; repo: string }}
 */
export function parseGithubOwnerRepo(baseUrl) {
  const m = baseUrl.match(/github\.com\/([^/]+)\/([^/?#]+)/);
  if (!m) {
    return { owner: "mubin-khalid", repo: "tunnel-manager" };
  }
  return { owner: m[1], repo: m[2] };
}
