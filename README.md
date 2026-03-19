![Tauri](https://img.shields.io/badge/Tauri-2.0-24C8DB?logo=tauri&logoColor=white)
![React](https://img.shields.io/badge/React-19-20232A?logo=react&logoColor=61DAFB)
![ngrok](https://img.shields.io/badge/ngrok-tunnel-1F1E37?logo=ngrok&logoColor=white)
![macOS](https://img.shields.io/badge/platform-macOS-lightgrey?logo=apple)
![Linux](https://img.shields.io/badge/platform-Linux-FCC624?logo=linux&logoColor=black)

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

## Installation

**Option A — Packaged build**

Download the DMG from Releases and open it like any other macOS app.

**Option B — Build locally**
```bash
pnpm tauri dev       # development
pnpm tauri build     # produce macOS bundles (including DMG)
```

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