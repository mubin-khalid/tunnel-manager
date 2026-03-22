// Unit tests — included into `lib.rs` under `#[cfg(test)] mod tests`.
// Run: `pnpm test:rust` or `cargo test --manifest-path src-tauri/Cargo.toml`.
//
// Covers serde round-trips and path helpers; no Tauri handle required.
use super::*;
use std::collections::HashMap;

// -------------------------------------------------------------------------
// ngrok_config_path / tunnel_definitions_path
// -------------------------------------------------------------------------

#[test]
fn ngrok_config_path_ends_with_expected_components() {
    let p = ngrok_config_path();
    let s = p.to_string_lossy();
    assert!(
        s.contains("ngrok-manager"),
        "expected 'ngrok-manager' in path, got: {s}"
    );
    assert!(
        s.ends_with("ngrok.yml"),
        "expected path to end with 'ngrok.yml', got: {s}"
    );
}

#[test]
fn tunnel_definitions_path_ends_with_expected_components() {
    let p = tunnel_definitions_path();
    let s = p.to_string_lossy();
    assert!(
        s.contains("ngrok-manager"),
        "expected 'ngrok-manager' in path, got: {s}"
    );
    assert!(
        s.ends_with("tunnel-definitions.json"),
        "expected path to end with 'tunnel-definitions.json', got: {s}"
    );
}

#[test]
fn ngrok_config_and_definitions_share_parent_directory() {
    let cfg = ngrok_config_path();
    let def = tunnel_definitions_path();
    assert_eq!(
        cfg.parent(),
        def.parent(),
        "ngrok.yml and tunnel-definitions.json should live in the same directory"
    );
}

// -------------------------------------------------------------------------
// AppSettings serialization round-trip
// -------------------------------------------------------------------------

#[test]
fn app_settings_round_trip_defaults() {
    let original = AppSettings {
        auto_start: false,
        authtoken: None,
        enabled_tunnels: vec![],
    };
    let json = serde_json::to_string(&original).expect("serialize");
    let restored: AppSettings = serde_json::from_str(&json).expect("deserialize");
    assert_eq!(restored.auto_start, original.auto_start);
    assert_eq!(restored.authtoken, original.authtoken);
    assert_eq!(restored.enabled_tunnels, original.enabled_tunnels);
}

#[test]
fn app_settings_round_trip_with_values() {
    let original = AppSettings {
        auto_start: true,
        authtoken: Some("tok_abc123".to_string()),
        enabled_tunnels: vec!["web".to_string(), "api".to_string()],
    };
    let json = serde_json::to_string(&original).expect("serialize");
    let restored: AppSettings = serde_json::from_str(&json).expect("deserialize");
    assert_eq!(restored.auto_start, true);
    assert_eq!(restored.authtoken.as_deref(), Some("tok_abc123"));
    assert_eq!(restored.enabled_tunnels, vec!["web", "api"]);
}

#[test]
fn app_settings_authtoken_skipped_when_none() {
    // "authtoken" should be absent from JSON when None (skip_serializing_if)
    let s = AppSettings {
        auto_start: false,
        authtoken: None,
        enabled_tunnels: vec![],
    };
    let json = serde_json::to_string(&s).expect("serialize");
    assert!(
        !json.contains("authtoken"),
        "authtoken key should be absent when None, got: {json}"
    );
}

// -------------------------------------------------------------------------
// TunnelEntry serialization round-trip
// -------------------------------------------------------------------------

#[test]
fn tunnel_entry_round_trip_no_host_header() {
    let entry = TunnelEntry {
        proto: "https".to_string(),
        addr: "localhost:3000".to_string(),
        host_header: None,
    };
    let json = serde_json::to_string(&entry).expect("serialize");
    let restored: TunnelEntry = serde_json::from_str(&json).expect("deserialize");
    assert_eq!(restored.proto, "https");
    assert_eq!(restored.addr, "localhost:3000");
    assert!(restored.host_header.is_none());
}

#[test]
fn tunnel_entry_round_trip_with_host_header() {
    let entry = TunnelEntry {
        proto: "http".to_string(),
        addr: "localhost:8080".to_string(),
        host_header: Some("myapp.local".to_string()),
    };
    let json = serde_json::to_string(&entry).expect("serialize");
    let restored: TunnelEntry = serde_json::from_str(&json).expect("deserialize");
    assert_eq!(restored.host_header.as_deref(), Some("myapp.local"));
}

#[test]
fn tunnel_entry_host_header_absent_when_none() {
    // skip_serializing_if = Option::is_none — keeps the JSON lean
    let entry = TunnelEntry {
        proto: "https".to_string(),
        addr: "localhost:3000".to_string(),
        host_header: None,
    };
    let json = serde_json::to_string(&entry).expect("serialize");
    assert!(
        !json.contains("host_header"),
        "host_header should be absent when None, got: {json}"
    );
}

// -------------------------------------------------------------------------
// Tunnel definitions map round-trip (the actual storage format)
// -------------------------------------------------------------------------

#[test]
fn tunnel_definitions_map_round_trip() {
    let mut defs: HashMap<String, TunnelEntry> = HashMap::new();
    defs.insert(
        "web".to_string(),
        TunnelEntry {
            proto: "https".to_string(),
            addr: "localhost:3000".to_string(),
            host_header: None,
        },
    );
    defs.insert(
        "api".to_string(),
        TunnelEntry {
            proto: "http".to_string(),
            addr: "localhost:4000".to_string(),
            host_header: Some("api.local".to_string()),
        },
    );

    let json = serde_json::to_string_pretty(&defs).expect("serialize");
    let restored: HashMap<String, TunnelEntry> = serde_json::from_str(&json).expect("deserialize");

    assert_eq!(restored.len(), 2);
    assert_eq!(restored["web"].proto, "https");
    assert_eq!(restored["api"].host_header.as_deref(), Some("api.local"));
}

// -------------------------------------------------------------------------
// NgrokConfig default
// -------------------------------------------------------------------------

#[test]
fn ngrok_config_default_version_is_three() {
    let cfg = NgrokConfig::default();
    assert_eq!(cfg.version, "3");
}

#[test]
fn ngrok_config_default_tunnels_empty() {
    let cfg = NgrokConfig::default();
    assert!(cfg.tunnels.is_empty());
}

// -------------------------------------------------------------------------
// enabled_tunnels filtering logic (mirrors start_ngrok's filter step)
// -------------------------------------------------------------------------

#[test]
fn filtering_definitions_by_enabled_list_works() {
    let mut defs: HashMap<String, TunnelEntry> = HashMap::new();
    defs.insert(
        "web".to_string(),
        TunnelEntry {
            proto: "https".to_string(),
            addr: "3000".to_string(),
            host_header: None,
        },
    );
    defs.insert(
        "api".to_string(),
        TunnelEntry {
            proto: "http".to_string(),
            addr: "4000".to_string(),
            host_header: None,
        },
    );
    defs.insert(
        "admin".to_string(),
        TunnelEntry {
            proto: "https".to_string(),
            addr: "5000".to_string(),
            host_header: None,
        },
    );

    let enabled = vec!["web".to_string(), "api".to_string()];

    let active: HashMap<String, TunnelEntry> = defs
        .into_iter()
        .filter(|(name, _)| enabled.contains(name))
        .collect();

    assert_eq!(active.len(), 2);
    assert!(active.contains_key("web"));
    assert!(active.contains_key("api"));
    assert!(!active.contains_key("admin"));
}

#[test]
fn filtering_with_empty_enabled_list_returns_empty() {
    let mut defs: HashMap<String, TunnelEntry> = HashMap::new();
    defs.insert(
        "web".to_string(),
        TunnelEntry {
            proto: "https".to_string(),
            addr: "3000".to_string(),
            host_header: None,
        },
    );

    let enabled: Vec<String> = vec![];
    let active: HashMap<String, TunnelEntry> = defs
        .into_iter()
        .filter(|(name, _)| enabled.contains(name))
        .collect();

    assert!(active.is_empty());
}

#[test]
fn filtering_with_unknown_name_in_enabled_list_is_ignored() {
    let mut defs: HashMap<String, TunnelEntry> = HashMap::new();
    defs.insert(
        "web".to_string(),
        TunnelEntry {
            proto: "https".to_string(),
            addr: "3000".to_string(),
            host_header: None,
        },
    );

    // "ghost" is in enabled but not in definitions — should be silently ignored
    let enabled = vec!["web".to_string(), "ghost".to_string()];
    let active: HashMap<String, TunnelEntry> = defs
        .into_iter()
        .filter(|(name, _)| enabled.contains(name))
        .collect();

    assert_eq!(active.len(), 1);
    assert!(active.contains_key("web"));
}
