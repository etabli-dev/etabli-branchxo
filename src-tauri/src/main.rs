// Copyright 2026 R. Heller
// SPDX-License-Identifier: Apache-2.0

// Desktop shell: a single window that loads the bundled web export of the game.
// No commands, plugins or capabilities are registered; the game runs offline.

// Prevents an additional console window on Windows in release builds.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    let mut context = tauri::generate_context!();
    // macOS smoke launches use a fresh WKWebView store, preserving saved games.
    if cfg!(target_os = "macos") && matches!(std::env::var("ETABLI_SMOKE_TEST").as_deref(), Ok("1"))
    {
        let identifier = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .expect("system clock predates Unix epoch")
            .as_nanos()
            .to_be_bytes();
        for window in &mut context.config_mut().app.windows {
            window.data_store_identifier = Some(identifier);
            window.width = 1280.0;
            window.height = 800.0;
        }
    }
    tauri::Builder::default()
        .run(context)
        .expect("failed to start the branchxo desktop shell");
}
