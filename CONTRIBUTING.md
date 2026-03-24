# Contributing to Tunnel Manager

Thanks for your interest in contributing. This document covers everything you need to get started.

---

## Development Setup

### Prerequisites

- [Node.js](https://nodejs.org/) (v20+)
- [pnpm](https://pnpm.io/) (`npm install -g pnpm`)
- [Rust toolchain](https://rustup.rs/) (stable)
- [ngrok CLI](https://ngrok.com/download) installed and on your PATH

### Running locally

```bash
# Install frontend dependencies
pnpm install

# Start the app in development mode (frontend + Tauri backend)
pnpm tauri dev
```

### Building

```bash
# Frontend only
pnpm build

# Full Tauri app (produces platform bundle)
pnpm tauri build

# Verify Rust backend compiles without building the full app
cd src-tauri && cargo check
```

---

## Before Opening a PR

Run all of these and fix any issues:

```bash
pnpm lint                         # ESLint
pnpm test                         # Vitest + `cargo test` (see package.json)
pnpm build                        # TypeScript + Vite build
cd src-tauri &&
cargo fmt --check &&              # Rust formatting
cargo clippy -- -D warnings &&   # Rust lints
cargo check                       # Rust compilation
```

---

## Pull Request Guidelines

- **One logical change per PR** — keep scope focused
- **Branch naming:** `feat/`, `fix/`, `chore/`, `refactor/` prefixes
- **Commit messages:** follow the format in `.cursorrules` (conventional commits)
- **UI changes:** include a screenshot or describe how to test visually
- **CHANGELOG:** add your change to the `[Unreleased]` section in `CHANGELOG.md`

### PR description should cover

- What changed
- Why it changed
- How to test it

---

## Project Structure

```text
src/                  # React frontend
  components/         # UI components grouped by domain
  pages/              # Page-level components (Dashboard, Tunnels, Settings)
  utils/              # Shared utilities
  types/              # TypeScript types (barrel: types/index.ts)
  config/             # Build-time helpers (e.g. repository URL from package.json)
src-tauri/            # Rust backend (Tauri)
  src/lib.rs          # All Tauri commands (process management, file I/O)
.github/workflows/    # ci.yml (PRs); release.yml (on GitHub Release created → upload Linux + macOS DMGs)
scripts/              # sync-version.mjs, sync-repo-urls.mjs, repo-utils.mjs
```

### Repository URL

Do **not** hardcode `https://github.com/…` in React for first-party links. The canonical remote is `package.json` → `repository`; Vite injects `import.meta.env.VITE_REPOSITORY_URL`. After moving or forking the repository, update `repository` (and `bugs` / `homepage` if you use them), run `pnpm sync:repo` to refresh README badges and `CHANGELOG.md` footer links, then rebuild.

---

## Versioning

Version is the single source of truth in `package.json`. After you bump it:

1. Run `pnpm prebuild` or `node scripts/sync-version.mjs` so `src-tauri/Cargo.toml`
   and `src-tauri/tauri.conf.json` match `package.json` (the `prebuild` hook also
   runs before `pnpm build`). **Commit those two files** with the version bump.
   If only `package.json` changes, release builds and the app can still show the
   old semver until the next sync. The release workflow fails if the three
   versions disagree.
2. Add a `## [x.y.z] - YYYY-MM-DD` section to `CHANGELOG.md` (move items out of
   **`[Unreleased]`** when you cut the release). For compare links at the bottom,
   either run `pnpm sync:repo` (uses `package.json` `repository`) or update them
   to match the new remote.

Git tags for releases follow **`v` + semver** (for example `v0.2.3`). The tag name
(without `v`) must match `package.json` `version` — the release workflow checks this.

**Cutting a release:** merging to `main` does **not** publish binaries. After the
version bump is on `main`, open **GitHub → Releases → Draft a new release**, pick
or create tag `vX.Y.Z` (must match `package.json`), and publish (or save as
draft; `release.yml` runs on `release: created` and uploads **deb**, **rpm**,
**AppImage**, and **DMG** assets to that release). Pushing only a git tag without
creating a GitHub Release does not run this workflow.

---

## Platform Support


| Platform            | Status                    |
| ------------------- | ------------------------- |
| macOS (arm64 + x64) | ✅ Supported               |
| Linux (deb / rpm / AppImage) | ✅ Supported        |
| Windows             | ❌ Not currently supported |


---

## Reporting Issues

Please use the GitHub issue templates — they ensure you include the right
information to reproduce the problem.

### Git hooks

After cloning, register the project git hooks:
```bash
git config core.hooksPath .githooks
```

This runs `cargo fmt` automatically before every commit.