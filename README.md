![Tauri](https://img.shields.io/badge/Tauri-2.0-24C8DB?logo=tauri&logoColor=white)
![React](https://img.shields.io/badge/React-19-20232A?logo=react&logoColor=61DAFB)
![ngrok](https://img.shields.io/badge/ngrok-tunnel-1F1E37?logo=ngrok&logoColor=white)
![macOS](https://img.shields.io/badge/platform-macOS-lightgrey?logo=apple)
![Linux](https://img.shields.io/badge/platform-Linux-FCC624?logo=linux&logoColor=black)
![CI](https://img.shields.io/github/actions/workflow/status/mubin-khalid/tunnel-manager/ci.yml?label=CI&logo=github)
![Release](https://img.shields.io/github/actions/workflow/status/mubin-khalid/tunnel-manager/release.yml?branch=main&label=release&logo=github)
![AppImage](https://img.shields.io/github/actions/workflow/status/mubin-khalid/tunnel-manager/build-appimage.yml?label=AppImage&logo=github)
![DMG](https://img.shields.io/github/actions/workflow/status/mubin-khalid/tunnel-manager/build-dmg.yml?label=DMG&logo=github)

# Tunnel Manager

A lightweight desktop app (Tauri + React) for managing `ngrok` tunnels from a clean UI — no more memorizing config paths or authtoken flags.

---

## Why you need this

If you regularly run ngrok for local development, the repetitive parts are usually:

- keeping tunnel definitions organized
- remembering where your `ngrok.yml` lives
- passing your authtoken and starting/stopping tunnels consistently

Tunnel Manager wraps those steps in a simple UI and stores settings under your user config directory.

> [!TIP]
> Free-plan friendly: define multiple tunnels and start them together in one click, so you can bring up several endpoints at the same time (within whatever concurrency your ngrok plan allows).

---

## Features

| Feature | Description |
|---|---|
| **Dashboard** | Start/stop `ngrok` and view active tunnels |
| **Tunnels** | Add, edit, and delete tunnel definitions from the UI |
| **Settings** | Save your `ngrok` authtoken and optionally auto-start on launch |

---
## Screenshots

<!-- TODO: add after feat/tunnel-enable-disable is merged -->

## How it works

When you click **Start ngrok**, the app runs:
```bash
ngrok start --all --authtoken <token> --config <path-to-ngrok.yml> --log stderr --log-level error
```

When you stop, it kills the running `ngrok` child process.

---

## Requirements

- `ngrok` CLI installed on your machine
- Node.js + pnpm
- Rust toolchain (for development / building the Tauri backend)

---

## Configuration

Tunnel Manager stores config in:
```
~/.config/ngrok-manager/settings.json   # app preferences
~/.config/ngrok-manager/ngrok.yml       # tunnel definitions
```

### `settings.json`

| Key | Type | Description |
|---|---|---|
| `auto_start` | boolean | Start ngrok automatically when the app launches |
| `authtoken` | string | Your ngrok authtoken (optional) |

> [!WARNING]
> The `authtoken` is stored as plaintext in `settings.json`. Treat this file
> like a password — do not commit it, share it, or expose it in logs.
> On macOS, ensure the file permissions are restricted (`chmod 600 ~/.config/ngrok-manager/settings.json`).

### `ngrok.yml`

The app expects ngrok v3 style YAML:
```yaml
version: "3"
tunnels:
  your-tunnel-name:
    addr: "http://localhost:3000"
    proto: http
```

> Supported `proto` values: `http`, `tcp`, `tls`. `host_header` is optional.

---

## Platform Support

| Platform | Status | Notes |
|----------|--------|-------|
| macOS (arm64) | ✅ Supported | Primary target |
| macOS (x64) | ✅ Supported | |
| Linux (AppImage) | ✅ Supported | |
| Windows | ❌ Not supported | Binary resolver and process management rely on Unix conventions |

## Installation

**Option A — Packaged build**

Download the DMG from Releases and open it like any other macOS app.

> [!CAUTION]
> If macOS shows *“Tunnel Manager can’t be opened because Apple cannot check it for malware” or "App is damaged" etc* (Gatekeeper quarantine), remove the quarantine attribute and try again.
>
> ```bash
> xattr -dr com.apple.quarantine "/Applications/Tunnel Manager.app"
> ```

**Option B — Build locally**
```bash
pnpm tauri dev       # development
pnpm tauri build     # produce macOS bundles (including DMG)
```

---
### Troubleshooting macOS quarantine

If macOS blocks the app with Gatekeeper quarantine errors, run:

```bash
xattr -dr com.apple.quarantine "/Applications/Tunnel Manager.app"
```

If your `.app` is located somewhere else (or has a different name), update the path accordingly.

---
## Usage

1. Open the app
2. Go to **Settings** → paste your `ngrok` authtoken
3. Go to **Tunnels** → add your tunnel definitions
4. Go to **Dashboard** → click **Start ngrok**

---

## Customization

### ngrok binary resolution

On macOS, apps launched from Finder may not inherit your shell `PATH`. Tunnel Manager resolves `ngrok` in this order:

1. `NGROK_PATH` environment variable (if set)
2. `which ngrok` (normal PATH lookup)
3. Common Homebrew locations (`/usr/local/bin/ngrok`, `/opt/homebrew/bin/ngrok`)

To force a specific binary:
```bash
NGROK_PATH=/full/path/to/ngrok
```

---

## Development
```bash
pnpm tauri dev        # start frontend + Tauri dev backend
pnpm build            # build frontend only
pnpm tauri build      # produce release bundles
cd src-tauri && cargo check  # verify Rust backend compiles
```

---

## Contributing

When submitting a PR:

- Keep scope focused — one logical change per PR
- Include a clear description of what changed and why
- For UI changes, attach a screenshot or reproduction steps
- Before opening, run `pnpm build` and `pnpm tauri build` (or `cargo check` if bundling isn't practical)

**PR description should cover:**
- What changed
- Why it changed
- How to test
