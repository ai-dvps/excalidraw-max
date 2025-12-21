//! Save commands for the Excalidraw application.
//!
//! This module provides Tauri commands for saving drawings to the local filesystem.

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::PathBuf;
use tauri::Manager;
use tauri::{AppHandle, Emitter};

/// Result of a save operation.
#[derive(Debug, Serialize, Deserialize)]
pub struct SaveResult {
    /// True if save completed successfully.
    pub success: bool,
    /// Path where file was saved (null if cancelled).
    pub file_path: Option<String>,
    /// Error message if success is false.
    pub error: Option<String>,
}

/// Request payload for save_drawing command.
#[derive(Deserialize)]
pub struct SaveDrawingRequest {
    /// JSON serialization of the drawing data.
    pub json_data: String,
    /// The file path to save to (from frontend file dialog).
    #[serde(default)]
    pub file_path: Option<String>,
}

/// Window state for the state machine
#[derive(Clone, Debug, Default, Serialize, Deserialize)]
pub struct WindowStateRust {
    pub state: String,
    pub file_path: Option<String>,
    pub last_saved_at: Option<String>,
    pub has_unsaved_changes: bool,
}

/// Mutable save state managed by the application.
#[derive(Debug, Default)]
pub struct AppSaveState(pub std::sync::Mutex<SaveStateRust>);

/// Application state that includes both save state and window states
#[derive(Debug, Default)]
pub struct AppState<S = SaveStateRust> {
    pub save: std::sync::Mutex<S>,
    pub window_states: std::sync::Mutex<HashMap<String, WindowStateRust>>,
}

/// Type alias for app state with window states
pub type AppWindowStates = AppState<SaveStateRust>;

/// Rust-side save state representation.
#[derive(Clone, Debug, Default)]
pub struct SaveStateRust {
    /// Whether there are unsaved changes.
    pub has_unsaved_changes: bool,
    /// Current file path (null if never saved).
    pub current_file_path: Option<String>,
    /// Last saved timestamp.
    pub last_saved_at: Option<String>,
    /// Whether a save operation is in progress.
    pub is_saving: bool,
}

/// Get the current save state from the app's managed state.
#[tauri::command]
pub fn get_save_state(app: AppHandle) -> Result<SaveStateRust, String> {
    // Access state managed by the application
    let state = app.state::<AppSaveState>();
    let guard = state.0.lock().map_err(|_| "Failed to lock state")?;
    Ok(guard.clone())
}

/// Save the drawing to a file.
///
/// If `file_path` is provided, saves to that path.
/// Emits `save-state-changed` event on success or failure.
#[tauri::command]
pub async fn save_drawing(
    app: AppHandle,
    json_data: String,
    file_path: Option<String>,
) -> Result<SaveResult, String> {
    // Get current path from app state
    let current_path = {
        let state = app.state::<AppSaveState>();
        let guard = state.0.lock().map_err(|_| "Failed to lock state")?;
        guard.current_file_path.clone()
    };

    // Use provided file path or fallback to current path
    let path = file_path.or(current_path).ok_or("No file path provided")?;
    let path_buf = PathBuf::from(&path);

    // Write to file
    match std::fs::write(&path_buf, json_data) {
        Ok(_) => {
            let path_string = path_buf.to_string_lossy().to_string();

            // Update app state
            {
                let state = app.state::<AppSaveState>();
                let mut guard = state.0.lock().map_err(|_| "Failed to lock state")?;
                guard.current_file_path = Some(path_string.clone());
                guard.has_unsaved_changes = false;
                guard.last_saved_at = Some(chrono::Utc::now().to_rfc3339());
            }

            // Emit save state changed event
            let _ = app.emit(
                "save-state-changed",
                serde_json::json!({
                    "hasUnsavedChanges": false,
                    "currentFilePath": path_string
                }),
            );

            Ok(SaveResult {
                success: true,
                file_path: Some(path_string),
                error: None,
            })
        }
        Err(e) => {
            let error_msg = e.to_string();
            let current_path = {
                let state = app.state::<AppSaveState>();
                let guard = state.0.lock().map_err(|_| "Failed to lock state")?;
                guard.current_file_path.clone()
            };

            // Emit save state changed event with error
            let _ = app.emit(
                "save-state-changed",
                serde_json::json!({
                    "hasUnsavedChanges": true,
                    "currentFilePath": current_path
                }),
            );

            Ok(SaveResult {
                success: false,
                file_path: None,
                error: Some(error_msg),
            })
        }
    }
}

/// Mark the drawing as having unsaved changes.
#[tauri::command]
pub fn mark_unsaved(app: AppHandle, has_changes: bool) -> Result<(), String> {
    let state = app.state::<AppSaveState>();
    let mut guard = state.0.lock().map_err(|_| "Failed to lock state")?;

    guard.has_unsaved_changes = has_changes;

    // Emit event for state change
    let _ = app.emit(
        "save-state-changed",
        serde_json::json!({
            "hasUnsavedChanges": has_changes,
            "currentFilePath": guard.current_file_path.clone()
        }),
    );

    Ok(())
}
