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
pnpm build                        # TypeScript + Vite build
cd src-tauri &&
cargo fmt --check &&              # Rust formatting
cargo clippy &&                   # Rust lints
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
  types/              # TypeScript types
src-tauri/            # Rust backend (Tauri)
  src/lib.rs          # All Tauri commands (process management, file I/O)
.github/workflows/    # CI — release.yml, build-dmg.yml, build-appimage.yml
scripts/              # sync-version.mjs (keeps package.json/Cargo.toml in sync)
```

---

## Versioning

Version is the single source of truth in `package.json`. The `prebuild` script
syncs it to `Cargo.toml` and `tauri.conf.json` automatically. Never manually
edit the version in those files.

---

## Platform Support


| Platform            | Status                    |
| ------------------- | ------------------------- |
| macOS (arm64 + x64) | ✅ Supported               |
| Linux (AppImage)    | ✅ Supported               |
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