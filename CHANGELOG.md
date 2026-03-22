# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

## [0.2.4] - 2026-03-22

### Added

- Prettier with `eslint-config-prettier` so ESLint does not duplicate formatting rules
- `pnpm format` script to format the TypeScript/CSS tree and project config files
- TypeScript types consolidated under `src/types/` (navigation, tunnel form/context, page props, `component-props`, shared `EMPTY_TUNNEL_FORM`)
- `package.json` `repository` / `bugs` / `homepage` as the canonical Git remote; Vite exposes `import.meta.env.VITE_REPOSITORY_URL` for the app (sidebar “releases” link uses `src/config/repository.ts`, not a hardcoded org)
- `scripts/repo-utils.mjs` and `pnpm sync:repo` (`scripts/sync-repo-urls.mjs`) to rewrite README badge URLs and Keep a Changelog footer links when the repo moves

### Changed

- Use `@/…` path alias imports consistently (including types barrel, tunnel list row, tests, and the app icon import)
- **GitHub Actions:** `release.yml` runs a **macOS** job after the Linux job: builds **DMG** for `aarch64-apple-darwin` and `x86_64-apple-darwin` and uploads them to the **same** draft release as the Linux bundles (no separate release-triggered workflow)

### Removed

- `.github/workflows/build-dmg.yml` (merged into `release.yml`)

## [0.2.2] - 2026-03-22

### Fixed

- Linux release and CI failing to compile `glib-sys` / `gobject-sys` (install full Tauri v2 Linux dependencies: `build-essential`, `pkg-config`, GTK/WebKit stack, OpenSSL, Ayatana appindicator, etc.)

### Changed

- **GitHub Actions:** `release.yml` (push to `main`) builds Linux bundles with `bundle.targets: "all"` and uploads **deb**, **rpm**, and **AppImage** to the draft release via `tauri-apps/tauri-action`
- **README:** workflow badges for CI and Release (`release.yml`); removed separate AppImage badge that pointed at a redundant workflow

### Removed

- `.github/workflows/build-appimage.yml` (duplicate of the Linux artifacts already produced in `release.yml`)

## [0.2.0] - 2026-03-22

### Added

- Tunnel enable/disable toggle with free-plan 3-tunnel limit enforcement
- CONTRIBUTING.md, CODE_OF_CONDUCT.md, issue and PR templates
- Per-tunnel enable/disable toggle with active counter (`X / Y enabled`)
- Free plan guard: blocks enabling a 4th tunnel with a tooltip warning
- `tunnel-definitions.json` as the source of truth for tunnel definitions
- Auto-migration of existing `ngrok.yml` tunnels on first launch (all enabled by default)

### Changed

- CI restructured to 3-workflow pattern (draft release → DMG + AppImage builds)
- Tunnel definitions now stored separately from generated ngrok.yml
- `ngrok.yml` is now generated at start time from enabled tunnels only
- Dashboard empty state now reflects enabled tunnels, not total defined
- Start is blocked with an error message if no tunnels are enabled
- Extracted `stripUrl`, `normalizeHost`, `normalizeAddr`, `formatTunnelName` to `src/utils/tunnel.ts`
- Extracted `toErrorString` to `src/utils/error.ts`, replaced all `catch (e: any)` usages
- Extracted tunnel form/save logic from `TunnelsPage` into `useTunnelForm` hook

### Fixed

- Zombie process on Unix after stop_ngrok (child.wait() after kill)
- StatusDot hardcoded colors replaced with CSS variables

### Removed

- old actions

---

## [0.1.1] - 2026-03-20

### Added

- Initial public release
- Dashboard: start/stop ngrok and view active tunnel URLs
- Tunnels: add, edit, and delete tunnel definitions from the UI
- Settings: save ngrok authtoken and optionally auto-start on launch
- macOS DMG and Linux AppImage builds via GitHub Actions
- System tray icon with Show/Quit menu
- Auto-migration of legacy ngrok config locations on first launch
- Copy tunnel URL to clipboard from the Dashboard

---

[Unreleased]: https://github.com/mubin-khalid/tunnel-manager/compare/v0.2.4...HEAD
[0.2.4]: https://github.com/mubin-khalid/tunnel-manager/compare/v0.2.3...v0.2.4
[0.2.3]: https://github.com/mubin-khalid/tunnel-manager/compare/v0.2.2...v0.2.3
[0.2.2]: https://github.com/mubin-khalid/tunnel-manager/compare/v0.2.0...v0.2.2
[0.2.0]: https://github.com/mubin-khalid/tunnel-manager/compare/v0.1.1...v0.2.0
[0.1.1]: https://github.com/mubin-khalid/tunnel-manager/releases/tag/v0.1.1
