#!/usr/bin/env node
/**
 * Rewrites GitHub URLs in README.md (badges) and CHANGELOG.md (footer compare links)
 * from `package.json` → `repository`. Run after moving the repo or changing owner:
 *
 *   node scripts/sync-repo-urls.mjs
 *
 * Commit the resulting diff with your repository / version bump.
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getRepositoryBaseUrl, parseGithubOwnerRepo } from "./repo-utils.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");

const pkg = JSON.parse(await fs.readFile(path.join(repoRoot, "package.json"), "utf8"));
const base = getRepositoryBaseUrl(pkg);
const { owner, repo } = parseGithubOwnerRepo(base);

async function patchReadme() {
  const p = path.join(repoRoot, "README.md");
  let s = await fs.readFile(p, "utf8");
  s = s.replace(
    /https:\/\/img\.shields\.io\/github\/actions\/workflow\/status\/[^/]+\/[^/]+\//g,
    `https://img.shields.io/github/actions/workflow/status/${owner}/${repo}/`
  );
  await fs.writeFile(p, s, "utf8");
  console.log("Updated README.md badges");
}

async function patchChangelog() {
  const p = path.join(repoRoot, "CHANGELOG.md");
  let s = await fs.readFile(p, "utf8");
  // Keep a Changelog footer: [label]: https://github.com/OLD/OLD/compare... → new base, same path
  s = s.replace(
    /^(\[[^\]]+\]: )https:\/\/github\.com\/[^/]+\/[^/]+(.*)$/gm,
    (_, prefix, rest) => `${prefix}${base}${rest}`
  );
  await fs.writeFile(p, s, "utf8");
  console.log("Updated CHANGELOG.md repository links");
}

await patchReadme();
await patchChangelog();
console.log(`Repository base: ${base}`);
