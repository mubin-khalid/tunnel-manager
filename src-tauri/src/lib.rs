//! Tunnel Manager Tauri backend: ngrok process lifecycle, config on disk, and commands for the UI.

use serde::{Deserialize, Serialize};
use serde_yaml::Value as YamlValue;
use std::collections::HashMap;
use std::process::{Child, Command, Stdio};
use std::sync::Mutex;
use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Manager, State,
};

pub struct NgrokProcess(pub Mutex<Option<Child>>);

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct TunnelConfig {
    pub name: String,
    pub proto: String,
    pub addr: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub host_header: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct NgrokConfig {
    pub version: String,
    pub agent: AgentConfig,
    pub tunnels: HashMap<String, TunnelEntry>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AgentConfig {
    pub authtoken: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct TunnelEntry {
    pub proto: String,
    pub addr: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub host_header: Option<String>,
}

impl Default for NgrokConfig {
    /// Builds an empty v3 config with no tunnels and an empty agent token placeholder.
    fn default() -> Self {
        NgrokConfig {
            version: "3".to_string(),
            agent: AgentConfig {
                authtoken: "".to_string(),
            },
            tunnels: HashMap::new(),
        }
    }
}

#[derive(Debug, Serialize, Deserialize, Clone, Default)]
pub struct AppSettings {
    pub auto_start: bool,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub authtoken: Option<String>,
    #[serde(default)]
    pub enabled_tunnels: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct NgrokTunnelAddr {
    pub proto: String,
    pub public_url: String,
    pub config: NgrokTunnelConfig,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct NgrokTunnelConfig {
    pub addr: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct NgrokApiResponse {
    pub tunnels: Vec<NgrokTunnelAddr>,
}

/// Returns the path to the generated `ngrok.yml` passed to the ngrok CLI (`--config`).
fn ngrok_config_path() -> std::path::PathBuf {
    // Store ngrok config (tunnels) under the same root as ngrok-manager settings.
    // We also pass `--config` to ngrok when starting, so ngrok uses this file.
    let home = dirs::home_dir().unwrap_or_else(|| std::path::PathBuf::from("."));
    home.join(".config").join("ngrok-manager").join("ngrok.yml")
}

/// Returns the path to `tunnel-definitions.json` (authoritative tunnel list from the UI).
fn tunnel_definitions_path() -> std::path::PathBuf {
    let home = dirs::home_dir().unwrap_or_else(|| std::path::PathBuf::from("."));
    home.join(".config")
        .join("ngrok-manager")
        .join("tunnel-definitions.json")
}

/// Returns whether `path` is a regular file with any execute bit set (Unix), or exists (elsewhere).
fn is_executable(path: &std::path::Path) -> bool {
    if !path.is_file() {
        return false;
    }

    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        if let Ok(meta) = std::fs::metadata(path) {
            return meta.permissions().mode() & 0o111 != 0;
        }
    }

    // Fallback for non-unix or permission checking failures.
    true
}

/// Locates the `ngrok` binary: `NGROK_PATH`, `PATH`, then common install directories.
fn resolve_ngrok_executable() -> Option<std::path::PathBuf> {
    // Allow explicit override.
    if let Ok(p) = std::env::var("NGROK_PATH") {
        let provided = std::path::PathBuf::from(p);
        let candidate = if provided.is_dir() {
            provided.join("ngrok")
        } else {
            provided
        };
        if is_executable(&candidate) {
            return Some(candidate);
        }
    }

    // Usual behavior first (respects PATH for the current process).
    if let Ok(p) = which::which("ngrok") {
        return Some(p);
    }

    // When a macOS app is launched from Finder/DMG, PATH is often minimal.
    // Check common install locations too.
    let home = dirs::home_dir().unwrap_or_else(|| std::path::PathBuf::from("."));
    let candidates = vec![
        std::path::PathBuf::from("/usr/local/bin/ngrok"), // Intel Homebrew
        std::path::PathBuf::from("/opt/homebrew/bin/ngrok"), // Apple Silicon Homebrew
        std::path::PathBuf::from("/usr/bin/ngrok"),
        std::path::PathBuf::from("/bin/ngrok"),
        home.join(".local/bin/ngrok"),
    ];

    candidates.into_iter().find(|p| is_executable(p))
}

/// Terminates any running `ngrok` processes so a new agent can start (single-agent limit).
fn kill_any_existing_ngrok_processes() -> Result<(), String> {
    // If there is an existing ngrok agent running outside of our managed process state,
    // ngrok may reject new agents with ERR_NGROK_108 (single concurrent agent limit).
    //
    // We attempt to kill any running `ngrok` processes before starting a new one.
    let output = Command::new("pgrep")
        .args(["-x", "ngrok"])
        .output()
        .map_err(|e| e.to_string())?;

    if !output.status.success() {
        // pgrep returns non-zero when no processes match; that's fine.
        return Ok(());
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    let pids: Vec<String> = stdout
        .split_whitespace()
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty())
        .collect();

    if pids.is_empty() {
        return Ok(());
    }

    for pid in &pids {
        let status = Command::new("kill")
            .args(["-9", pid])
            .status()
            .map_err(|e| e.to_string())?;
        if !status.success() {
            return Err(format!("Failed to kill ngrok process pid={}", pid));
        }
    }

    Ok(())
}

/// Returns `~/.config/ngrok-manager/settings.json` (app preferences and authtoken).
fn app_settings_path() -> std::path::PathBuf {
    // Store ngrok-manager settings under `~/.config/ngrok-manager/settings.json`
    // (dirs::config_dir() differs on macOS and may point to `~/Library/...`).
    let home = dirs::home_dir().unwrap_or_else(|| std::path::PathBuf::from("."));
    home.join(".config")
        .join("ngrok-manager")
        .join("settings.json")
}

/// Previous settings location under `dirs::config_dir()`; used only for one-time migration.
fn legacy_app_settings_path() -> std::path::PathBuf {
    dirs::config_dir()
        .unwrap_or_else(|| std::path::PathBuf::from("."))
        .join("ngrok-manager")
        .join("settings.json")
}

/// Legacy ngrok v2-style config path under the platform config directory.
fn legacy_ngrok_config_path() -> std::path::PathBuf {
    dirs::config_dir()
        .unwrap_or_else(|| std::path::PathBuf::from("."))
        .join("ngrok")
        .join("ngrok.yml")
}

/// Moves settings and tunnel data from legacy paths and strips tokens from old `ngrok.yml` files.
fn migrate_settings_and_cleanup() -> Result<(), String> {
    // 1) Move settings.json from legacy location to the desired one.
    let old_settings = legacy_app_settings_path();
    let new_settings = app_settings_path();

    if old_settings.exists() {
        if !new_settings.exists() {
            let content = std::fs::read_to_string(&old_settings).map_err(|e| e.to_string())?;
            let parsed: AppSettings = serde_json::from_str(&content).unwrap_or_default();

            if let Some(parent) = new_settings.parent() {
                std::fs::create_dir_all(parent).map_err(|e| e.to_string())?;
            }
            let out = serde_json::to_string_pretty(&parsed).map_err(|e| e.to_string())?;
            std::fs::write(&new_settings, out).map_err(|e| e.to_string())?;
        }

        // Remove legacy token storage.
        let _ = std::fs::remove_file(&old_settings);
    }

    // 2) Remove any authtoken from legacy ngrok.yml (we now only store tokens in settings.json).
    let old_ngrok = legacy_ngrok_config_path();
    if old_ngrok.exists() {
        let content = std::fs::read_to_string(&old_ngrok).map_err(|e| e.to_string())?;
        if !content.trim().is_empty() {
            if let Ok(mut root) = serde_yaml::from_str::<YamlValue>(&content) {
                if let YamlValue::Mapping(map) = &mut root {
                    let agent_key = YamlValue::String("agent".to_string());
                    let authtoken_key = YamlValue::String("authtoken".to_string());
                    if let Some(YamlValue::Mapping(agent_map)) = map.get_mut(&agent_key) {
                        agent_map.remove(&authtoken_key);
                        // If agent becomes empty, remove it entirely to avoid leaving stale token placeholders.
                        if agent_map.is_empty() {
                            map.remove(&agent_key);
                        }
                    }

                    let out = serde_yaml::to_string(&root).map_err(|e| e.to_string())?;
                    std::fs::write(&old_ngrok, out).map_err(|e| e.to_string())?;
                }
            }
        }
    }

    // 3) Migrate tunnels into our unified ngrok-manager config file.
    // If ngrok-manager/ngrok.yml is empty/missing, try to copy tunnels from common legacy locations.
    let new_ngrok_cfg = ngrok_config_path();
    let new_empty = match std::fs::read_to_string(&new_ngrok_cfg) {
        Ok(s) => s.trim().is_empty(),
        Err(_) => true,
    };

    if new_empty {
        let legacy_candidates = vec![
            legacy_ngrok_config_path(), // dirs::config_dir()/ngrok/ngrok.yml (may be macOS library root)
            dirs::home_dir()
                .unwrap_or_else(|| std::path::PathBuf::from("."))
                .join(".config")
                .join("ngrok")
                .join("ngrok.yml"),
            dirs::home_dir()
                .unwrap_or_else(|| std::path::PathBuf::from("."))
                .join(".ngrok2")
                .join("ngrok.yml"),
        ];

        for candidate in legacy_candidates {
            if !candidate.exists() {
                continue;
            }
            let content = std::fs::read_to_string(&candidate).unwrap_or_default();
            if content.trim().is_empty() {
                continue;
            }
            if let Ok(parsed) = serde_yaml::from_str::<NgrokYamlConfig>(&content) {
                if !parsed.tunnels.is_empty() {
                    let version = parsed.version.unwrap_or_else(|| "3".to_string());
                    let tunnels_value =
                        serde_yaml::to_value(&parsed.tunnels).map_err(|e| e.to_string())?;

                    let mut root = serde_yaml::Mapping::new();
                    root.insert(
                        YamlValue::String("version".to_string()),
                        YamlValue::String(version),
                    );
                    root.insert(YamlValue::String("tunnels".to_string()), tunnels_value);

                    let out = serde_yaml::to_string(&YamlValue::Mapping(root))
                        .map_err(|e| e.to_string())?;

                    if let Some(parent) = new_ngrok_cfg.parent() {
                        std::fs::create_dir_all(parent).map_err(|e| e.to_string())?;
                    }
                    std::fs::write(&new_ngrok_cfg, out).map_err(|e| e.to_string())?;
                    break;
                }
            }
        }
    }

    // 4) Migrate tunnel definitions from ngrok.yml -> tunnel-definitions.json (run once).
    let definitions_path = tunnel_definitions_path();
    if !definitions_path.exists() {
        let ngrok_cfg = ngrok_config_path();
        if ngrok_cfg.exists() {
            let content = std::fs::read_to_string(&ngrok_cfg).unwrap_or_default();
            if !content.trim().is_empty() {
                if let Ok(parsed) = serde_yaml::from_str::<NgrokYamlConfig>(&content) {
                    if !parsed.tunnels.is_empty() {
                        // Write tunnel-definitions.json
                        if let Some(parent) = definitions_path.parent() {
                            let _ = std::fs::create_dir_all(parent);
                        }
                        if let Ok(out) = serde_json::to_string_pretty(&parsed.tunnels) {
                            let _ = std::fs::write(&definitions_path, out);
                        }
                        // Enable all tunnels by default
                        let mut settings = read_settings();
                        settings.enabled_tunnels = parsed.tunnels.keys().cloned().collect();
                        let _ = write_settings(settings);
                    }
                }
            }
        }
    }

    Ok(())
}

/// Ensures `ngrok.yml` exists and is non-empty with a minimal valid v3 skeleton.
fn ensure_ngrok_config_exists() -> Result<(), String> {
    let path = ngrok_config_path();
    let ngrok_dir = path
        .parent()
        .map(|p| p.to_path_buf())
        .unwrap_or_else(|| std::path::PathBuf::from("."));
    std::fs::create_dir_all(&ngrok_dir).map_err(|e| e.to_string())?;

    if !path.exists() {
        std::fs::write(&path, "version: \"3\"\ntunnels: {}\n").map_err(|e| e.to_string())?;
        return Ok(());
    }

    // If file exists but is empty, initialize it so YAML parsing and ngrok startup behave.
    let meta = std::fs::metadata(&path).map_err(|e| e.to_string())?;
    if meta.len() == 0 {
        std::fs::write(&path, "version: \"3\"\ntunnels: {}\n").map_err(|e| e.to_string())?;
    }

    Ok(())
}

/// Returns the trimmed authtoken from settings, or `None` if missing or blank.
fn authtoken_from_settings() -> Option<String> {
    let settings = read_settings();
    settings
        .authtoken
        .as_ref()
        .map(|t| t.trim().to_string())
        .filter(|t| !t.is_empty())
}

#[derive(Debug, Deserialize, Default)]
struct NgrokYamlConfig {
    #[serde(default)]
    version: Option<String>,
    #[serde(default)]
    tunnels: HashMap<String, TunnelEntry>,
}

/// Returns whether a usable `ngrok` executable was found on this system.
#[tauri::command]
fn check_ngrok_installed() -> bool {
    resolve_ngrok_executable().is_some()
}

/// Loads app settings from disk, or returns defaults if the file is missing or invalid.
#[tauri::command]
fn read_settings() -> AppSettings {
    let path = app_settings_path();
    if !path.exists() {
        return AppSettings::default();
    }
    let content = std::fs::read_to_string(&path).unwrap_or_default();
    serde_json::from_str(&content).unwrap_or_default()
}

/// Persists app settings (authtoken, auto-start, enabled tunnel names) to disk.
#[tauri::command]
fn write_settings(settings: AppSettings) -> Result<(), String> {
    let path = app_settings_path();
    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    let content = serde_json::to_string_pretty(&settings).map_err(|e| e.to_string())?;
    std::fs::write(&path, content).map_err(|e| e.to_string())
}

/// Legacy: reads tunnel entries from `ngrok.yml` (migration path); errors in YAML yield an empty map.
/// Prefer [`get_tunnel_definitions`] for new code.
// TODO: remove once migration path is confirmed complete.
#[tauri::command]
fn read_tunnels() -> Result<HashMap<String, TunnelEntry>, String> {
    ensure_ngrok_config_exists()?;
    let path = ngrok_config_path();
    let content = std::fs::read_to_string(&path).map_err(|e| e.to_string())?;
    if content.trim().is_empty() {
        return Ok(HashMap::new());
    }

    let parsed: NgrokYamlConfig = match serde_yaml::from_str(&content) {
        Ok(v) => v,
        Err(e) => {
            eprintln!("Failed to parse {} tunnels: {}", path.display(), e);
            return Ok(HashMap::new());
        }
    };
    Ok(parsed.tunnels)
}

/// Legacy: writes the `tunnels` map into `ngrok.yml` while preserving YAML structure where possible.
#[tauri::command]
fn update_tunnels(tunnels: HashMap<String, TunnelEntry>) -> Result<(), String> {
    // Backend enforcement: don't allow tunnel edits without ngrok and a token.
    if resolve_ngrok_executable().is_none() {
        return Err("ngrok is not installed. Install it first.".to_string());
    }

    let token = authtoken_from_settings().ok_or_else(|| {
        "ngrok authtoken is missing. Please set it in Settings first.".to_string()
    })?;
    if token.trim().is_empty() {
        return Err("ngrok authtoken is missing. Please set it in Settings first.".to_string());
    }

    ensure_ngrok_config_exists()?;
    let path = ngrok_config_path();
    let content = std::fs::read_to_string(&path).unwrap_or_default();

    let mut root: YamlValue = if content.trim().is_empty() {
        YamlValue::Mapping(Default::default())
    } else {
        serde_yaml::from_str(&content).unwrap_or_else(|_| YamlValue::Mapping(Default::default()))
    };

    let tunnels_value = serde_yaml::to_value(&tunnels).map_err(|e| e.to_string())?;

    match &mut root {
        YamlValue::Mapping(map) => {
            // Preserve existing `version` if present; otherwise default to "3".
            let has_version = map
                .keys()
                .any(|k| matches!(k, YamlValue::String(s) if s == "version"));
            if !has_version {
                map.insert(
                    YamlValue::String("version".to_string()),
                    YamlValue::String("3".to_string()),
                );
            }
            map.insert(YamlValue::String("tunnels".to_string()), tunnels_value);
        }
        _ => {
            root = YamlValue::Mapping({
                let mut map = serde_yaml::Mapping::new();
                map.insert(
                    YamlValue::String("version".to_string()),
                    YamlValue::String("3".to_string()),
                );
                map.insert(YamlValue::String("tunnels".to_string()), tunnels_value);
                map
            });
        }
    }

    let out = serde_yaml::to_string(&root).map_err(|e| e.to_string())?;
    std::fs::write(&path, out).map_err(|e| e.to_string())
}

/// Reads the canonical tunnel definitions JSON edited from the Tunnels UI.
#[tauri::command]
fn get_tunnel_definitions() -> Result<HashMap<String, TunnelEntry>, String> {
    let path = tunnel_definitions_path();
    if !path.exists() {
        return Ok(HashMap::new());
    }
    let content = std::fs::read_to_string(&path).map_err(|e| e.to_string())?;
    if content.trim().is_empty() {
        return Ok(HashMap::new());
    }
    serde_json::from_str(&content).map_err(|e| e.to_string())
}

/// Saves tunnel definitions to JSON after validating ngrok is installed and an authtoken is set.
#[tauri::command]
fn update_tunnel_definitions(tunnels: HashMap<String, TunnelEntry>) -> Result<(), String> {
    if resolve_ngrok_executable().is_none() {
        return Err("ngrok is not installed. Install it first.".to_string());
    }
    let token = authtoken_from_settings().ok_or_else(|| {
        "ngrok authtoken is missing. Please set it in Settings first.".to_string()
    })?;
    if token.trim().is_empty() {
        return Err("ngrok authtoken is missing. Please set it in Settings first.".to_string());
    }

    let path = tunnel_definitions_path();
    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    let content = serde_json::to_string_pretty(&tunnels).map_err(|e| e.to_string())?;
    std::fs::write(&path, content).map_err(|e| e.to_string())
}

/// Spawns ngrok with enabled tunnel definitions, or returns an error if prerequisites are not met.
#[tauri::command]
fn start_ngrok(state: State<NgrokProcess>) -> Result<(), String> {
    let mut proc = state.0.lock().map_err(|e| e.to_string())?;
    if proc.is_some() {
        return Err("ngrok is already running".to_string());
    }

    // Ensure there isn't another ngrok agent running (even if we don't manage it).
    kill_any_existing_ngrok_processes()?;

    let ngrok_path = resolve_ngrok_executable()
        .ok_or_else(|| "ngrok is not installed. Install it first.".to_string())?;

    let token = authtoken_from_settings().ok_or_else(|| {
        "ngrok authtoken is missing. Please set it in Settings first.".to_string()
    })?;
    if token.trim().is_empty() {
        return Err("ngrok authtoken is missing. Please set it in Settings first.".to_string());
    }

    // Guard: no enabled tunnels → block start
    let settings = read_settings();
    let enabled: std::collections::HashSet<String> =
        settings.enabled_tunnels.iter().cloned().collect();

    if enabled.is_empty() {
        return Err(
            "No tunnels are enabled. Enable at least one tunnel before starting.".to_string(),
        );
    }

    // Generate ngrok.yml from enabled tunnel definitions only
    let definitions = get_tunnel_definitions()?;
    let active_tunnels: HashMap<String, TunnelEntry> = definitions
        .into_iter()
        .filter(|(name, _)| enabled.contains(name))
        .collect();

    if active_tunnels.is_empty() {
        return Err(
            "No enabled tunnels found in definitions. Add and enable at least one tunnel."
                .to_string(),
        );
    }

    // Write the generated ngrok.yml
    {
        let path = ngrok_config_path();
        if let Some(parent) = path.parent() {
            std::fs::create_dir_all(parent).map_err(|e| e.to_string())?;
        }
        let tunnels_value = serde_yaml::to_value(&active_tunnels).map_err(|e| e.to_string())?;
        let mut map = serde_yaml::Mapping::new();
        map.insert(
            YamlValue::String("version".to_string()),
            YamlValue::String("3".to_string()),
        );
        map.insert(YamlValue::String("tunnels".to_string()), tunnels_value);
        let out = serde_yaml::to_string(&YamlValue::Mapping(map)).map_err(|e| e.to_string())?;
        std::fs::write(&path, out).map_err(|e| e.to_string())?;
    }

    // Prevent ngrok from immediately exiting when there are no tunnels configured.
    let ngrok_cfg_path = ngrok_config_path();
    let content = std::fs::read_to_string(&ngrok_cfg_path).map_err(|e| e.to_string())?;
    let parsed: NgrokYamlConfig = serde_yaml::from_str(&content).unwrap_or_default();
    if parsed.tunnels.is_empty() {
        return Err("No tunnels configured. Add tunnels first.".to_string());
    }

    let ngrok_cfg_str = ngrok_cfg_path.to_string_lossy().to_string();
    let args = vec![
        "start".to_string(),
        "--all".to_string(),
        "--authtoken".to_string(),
        token,
        "--config".to_string(),
        ngrok_cfg_str,
        "--log".to_string(),
        "stderr".to_string(),
        "--log-level".to_string(),
        "error".to_string(),
    ];
    let mut child = Command::new(ngrok_path)
        .args(args)
        .stdout(Stdio::inherit())
        .stderr(Stdio::inherit())
        .spawn()
        .map_err(|e| format!("Failed to start ngrok: {}", e))?;

    // If ngrok exits very quickly (auth/config error), surface it to the UI.
    // We wait briefly to catch cases where it doesn't exit on the first poll.
    std::thread::sleep(std::time::Duration::from_millis(1500));
    if let Ok(Some(status)) = child.try_wait() {
        return Err(format!(
            "ngrok exited after start (status: {}). Check ngrok.yml + authtoken.",
            status
        ));
    }

    *proc = Some(child);
    Ok(())
}

/// Stops the managed ngrok child process and waits so it is reaped (avoids zombies on Unix).
#[tauri::command]
fn stop_ngrok(state: State<NgrokProcess>) -> Result<(), String> {
    let mut proc = state.0.lock().map_err(|e| e.to_string())?;
    if let Some(mut child) = proc.take() {
        child.kill().map_err(|e| e.to_string())?;

        // Reap the process so it doesn't become a zombie on Unix.
        // wait() blocks until the kernel confirms the process is fully gone,
        // which also eliminates the race condition with ngrok's single-agent-session limit.
        child.wait().ok();
    }
    Ok(())
}

/// Returns whether our managed ngrok process is still running (clears state if it has exited).
#[tauri::command]
fn ngrok_status(state: State<NgrokProcess>) -> bool {
    let Ok(mut proc) = state.0.lock() else {
        return false;
    };
    if let Some(child) = proc.as_mut() {
        match child.try_wait() {
            Ok(None) => true,
            Ok(Some(_)) => {
                *proc = None;
                false
            }
            Err(_) => false,
        }
    } else {
        false
    }
}

/// Fetches active tunnels from the local ngrok API (`localhost:4040`), or an empty list if down.
#[tauri::command]
async fn fetch_running_tunnels() -> Result<Vec<NgrokTunnelAddr>, String> {
    let client = reqwest::Client::new();
    let url = "http://localhost:4040/api/tunnels";

    // If ngrok isn't ready yet (or isn't running), just return no tunnels.
    // This avoids noisy errors while the app polls.
    let resp = match client.get(url).send().await {
        Ok(resp) => resp,
        Err(e) => {
            if e.is_connect() {
                return Ok(vec![]);
            }
            return Err(format!("Cannot reach ngrok API at {}: {}", url, e));
        }
    };

    let data: NgrokApiResponse = resp.json().await.map_err(|e| e.to_string())?;
    Ok(data.tunnels)
}

/// Builds the Tauri app, registers IPC commands, tray menu, and optional autostart of ngrok.
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(NgrokProcess(Mutex::new(None)))
        .setup(|app| {
            // Ensure we only store tokens under `~/.config` and clean legacy locations.
            // This is safe to run repeatedly (it only migrates once and cleans legacy files).
            migrate_settings_and_cleanup()?;

            let quit = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
            let show = MenuItem::with_id(app, "show", "Show", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&show, &quit])?;

            let _tray = TrayIconBuilder::new()
                .menu(&menu)
                .tooltip("Tunnel Manager")
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "quit" => app.exit(0),
                    "show" => {
                        if let Some(win) = app.get_webview_window("main") {
                            let _ = win.show();
                            let _ = win.set_focus();
                        }
                    }
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        let app = tray.app_handle();
                        if let Some(win) = app.get_webview_window("main") {
                            let _ = win.show();
                            let _ = win.set_focus();
                        }
                    }
                })
                .build(app)?;

            let settings = read_settings();
            if settings.auto_start {
                let state = app.state::<NgrokProcess>();
                let _ = start_ngrok(state);
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            check_ngrok_installed,
            read_settings,
            write_settings,
            read_tunnels,
            update_tunnels,
            get_tunnel_definitions,
            update_tunnel_definitions,
            start_ngrok,
            stop_ngrok,
            ngrok_status,
            fetch_running_tunnels,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[cfg(test)]
mod tests {
    include!(concat!(
        env!("CARGO_MANIFEST_DIR"),
        "/../tests/rust/lib_tests.rs"
    ));
}
