// Copyright 2026 R. Heller
// SPDX-License-Identifier: Apache-2.0

// Desktop shell: a single window that loads the bundled web export of the game.
// No commands, plugins or capabilities are registered; the game runs offline.

// Prevents an additional console window on Windows in release builds.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    tauri::Builder::default()
        .run(tauri::generate_context!())
        .expect("failed to start the branchxo desktop shell");
}
