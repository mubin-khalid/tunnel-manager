// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

/// Native entrypoint; delegates to [`tunnel_manager_lib::run`].
fn main() {
    tunnel_manager_lib::run()
}
