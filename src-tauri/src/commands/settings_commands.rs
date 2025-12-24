/// Settings commands for the Excalidraw application.
///
/// This module provides Tauri commands for loading, saving, resetting user settings,
/// and opening the settings window.

use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Emitter, Manager, WebviewUrl, WebviewWindowBuilder};
use tauri_plugin_store::StoreExt;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct EditorSettingsRust {
    #[serde(rename = "defaultBackgroundColor")]
    pub default_background_color: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct UserSettingsRust {
    pub general: Option<serde_json::Value>,
    pub appearance: Option<serde_json::Value>,
    pub shortcuts: Option<serde_json::Value>,
    pub editor: EditorSettingsRust,
}

/// Default settings to use when no stored settings exist.
impl Default for UserSettingsRust {
    fn default() -> Self {
        UserSettingsRust {
            general: None,
            appearance: None,
            shortcuts: None,
            editor: EditorSettingsRust {
                default_background_color: "#ffffff".to_string(),
            },
        }
    }
}

/// Load user settings from the Tauri store.
///
/// Returns the stored settings or default settings if none exist.
#[tauri::command]
pub async fn load_settings(app: AppHandle) -> Result<UserSettingsRust, String> {
    println!("[Settings] Loading settings from store...");
    let store = app.store("settings.json").map_err(|e| e.to_string())?;

    // Try to load stored settings - get returns Option<JsonValue>
    let json_value = store.get("settings");

    match json_value {
        Some(value) => {
            println!("[Settings] Found stored settings, deserializing...");
            let settings: UserSettingsRust = serde_json::from_value(value)
                .map_err(|e| format!("Failed to parse settings: {}", e))?;
            println!("[Settings] Loaded settings: {:?}", settings);
            Ok(settings)
        }
        None => {
            println!("[Settings] No stored settings found, returning defaults");
            // Return default settings if none stored
            Ok(UserSettingsRust::default())
        }
    }
}

/// Save user settings to the Tauri store.
///
/// Persists the settings to the store file for future retrieval.
#[tauri::command]
pub async fn save_settings(app: AppHandle, settings: UserSettingsRust) -> Result<(), String> {
    println!("[Settings] save_settings called with: {:?}", settings);
    let store = app.store("settings.json").map_err(|e| e.to_string())?;

    // Validate the settings before saving
    if !is_valid_hex_color(&settings.editor.default_background_color) {
        return Err("Invalid hex color format for defaultBackgroundColor".to_string());
    }

    // Convert settings to JSON value and save
    let json_value = serde_json::to_value(settings).map_err(|e| e.to_string())?;
    println!("[Settings] Saving JSON to store: {:?}", json_value);
    store.set("settings", json_value);

    // Force save to disk
    store.save().map_err(|e| e.to_string())?;
    println!("[Settings] Settings saved successfully");
    Ok(())
}

/// Reset user settings to default values.
///
/// Returns the default settings after resetting.
#[tauri::command]
pub async fn reset_settings(app: AppHandle) -> Result<UserSettingsRust, String> {
    println!("[Settings] Resetting settings to defaults...");
    let store = app.store("settings.json").map_err(|e| e.to_string())?;

    let default_settings = UserSettingsRust::default();
    println!("[Settings] Default settings: {:?}", default_settings);

    // Convert to JSON and save
    let json_value = serde_json::to_value(default_settings.clone())
        .map_err(|e| e.to_string())?;
    store.set("settings", json_value);

    // Force save to disk
    store.save().map_err(|e| e.to_string())?;
    println!("[Settings] Settings reset to defaults");
    Ok(default_settings)
}

/// Open the settings window.
///
/// Creates a new webview window for settings or shows an existing one.
#[tauri::command]
pub async fn open_settings_window(app: AppHandle) -> Result<(), String> {
    println!("[Settings] open_settings_window called");
    // Check if settings window already exists
    if let Some(window) = app.get_webview_window("settings") {
        println!("[Settings] Settings window already exists, showing and emitting reload event");
        // Show the existing window and emit event to reload settings
        let _ = window.show();
        let _ = window.set_focus();
        window.emit("settings-reload", ()).map_err(|e| e.to_string())?;
        return Ok(());
    }

    println!("[Settings] Creating new settings window");
    // Create a new settings window
    let window = WebviewWindowBuilder::new(
        &app,
        "settings",
        WebviewUrl::App("index.html#settings".into()),
    )
    .title("Settings")
    .inner_size(700.0, 700.0)
    .resizable(true)
    .center()
    .decorations(true)
    .closable(true)
    .focused(true)
    .devtools(true)
    .build()
    .map_err(|e| e.to_string())?;

    // Open devtools immediately after creating the window
    let _ = window.open_devtools();

    println!("[Settings] Settings window created");
    Ok(())
}

/// Validates a hex color format.
fn is_valid_hex_color(color: &str) -> bool {
    color.starts_with('#')
        && (color.len() == 7 || color.len() == 4)
        && color[1..]
            .chars()
            .all(|c| c.is_ascii_hexdigit())
}
