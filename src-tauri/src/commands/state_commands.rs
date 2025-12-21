/// State commands for window state management.
///
/// Provides Tauri commands for managing window save state (created/saved/edited).

use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Manager};

use super::save_commands::{WindowStateRust, AppState};

/// Actions for close confirmation dialog
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum CloseAction {
    Save,
    Discard,
    Cancel,
}

/// Input for updating window state
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WindowStateUpdate {
    pub state: String,
    pub file_path: Option<String>,
    pub has_unsaved_changes: bool,
}

/// Result of close confirmation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CloseConfirmationResult {
    pub action: String,
}

/// Get mutable access to the window states stored in app state
fn get_window_states(app: &AppHandle) -> tauri::State<'_, AppState> {
    app.state()
}

/// Get window state for a specific window label
#[tauri::command]
pub fn get_window_state(app: AppHandle, window_label: String) -> Result<WindowStateRust, String> {
    let states = get_window_states(&app);

    // Lock the window_states for reading
    let states_guard = states.window_states.lock().map_err(|e| e.to_string())?;

    if let Some(state) = states_guard.get(&window_label) {
        Ok(state.clone())
    } else {
        // Return initial state for new windows
        Ok(WindowStateRust {
            state: "created".to_string(),
            file_path: None,
            last_saved_at: None,
            has_unsaved_changes: false,
        })
    }
}

/// Update or create window state
#[tauri::command]
pub fn update_window_state(
    app: AppHandle,
    window_label: String,
    new_state: WindowStateUpdate,
) -> Result<(), String> {
    let states = get_window_states(&app);

    // Lock the window_states for writing
    let mut states_guard = states.window_states.lock().map_err(|e| e.to_string())?;

    let state = WindowStateRust {
        state: new_state.state.clone(),
        file_path: new_state.file_path.clone(),
        last_saved_at: if new_state.state == "saved" {
            Some(chrono::Utc::now().to_rfc3339())
        } else {
            None
        },
        has_unsaved_changes: new_state.has_unsaved_changes,
    };

    states_guard.insert(window_label, state);
    Ok(())
}

/// Mark window as saved with file path
#[tauri::command]
pub fn mark_window_saved(app: AppHandle, window_label: String, file_path: String) -> Result<(), String> {
    let states = get_window_states(&app);

    let mut states_guard = states.window_states.lock().map_err(|e| e.to_string())?;

    let state = WindowStateRust {
        state: "saved".to_string(),
        file_path: Some(file_path),
        last_saved_at: Some(chrono::Utc::now().to_rfc3339()),
        has_unsaved_changes: false,
    };

    states_guard.insert(window_label, state);
    Ok(())
}

/// Mark window as edited (has unsaved changes)
#[tauri::command]
pub fn mark_window_edited(app: AppHandle, window_label: String) -> Result<(), String> {
    let states = get_window_states(&app);

    let mut states_guard = states.window_states.lock().map_err(|e| e.to_string())?;

    // Update existing state or create new edited state
    let current = states_guard.get(&window_label).cloned();

    let file_path = current.as_ref().and_then(|s| s.file_path.clone());
    let last_saved_at = current.as_ref().and_then(|s| s.last_saved_at.clone());

    let state = WindowStateRust {
        state: "edited".to_string(),
        file_path,
        last_saved_at,
        has_unsaved_changes: true,
    };

    states_guard.insert(window_label, state);
    Ok(())
}

/// Check if window has unsaved changes (for close confirmation)
#[tauri::command]
pub fn has_unsaved_changes(app: AppHandle, window_label: String) -> Result<bool, String> {
    let states = get_window_states(&app);
    let states_guard = states.window_states.lock().map_err(|e| e.to_string())?;
    let state = states_guard.get(&window_label);

    Ok(state.map(|s| s.has_unsaved_changes).unwrap_or(false))
}

/// Get file path for window (for close dialog message)
#[tauri::command]
pub fn get_window_file_path(app: AppHandle, window_label: String) -> Result<Option<String>, String> {
    let states = get_window_states(&app);
    let states_guard = states.window_states.lock().map_err(|e| e.to_string())?;
    let state = states_guard.get(&window_label);

    Ok(state.and_then(|s| s.file_path.clone()))
}

/// Confirm close action with native dialog (simplified - returns action based on dialog result)
/// Note: The actual dialog is handled by the frontend for better async handling
#[tauri::command]
pub async fn confirm_close_with_unsaved(app: AppHandle, window_label: String) -> Result<CloseConfirmationResult, String> {
    // Check if window has unsaved changes
    let has_changes = has_unsaved_changes(app.clone(), window_label.clone())?;

    if !has_changes {
        return Ok(CloseConfirmationResult {
            action: "discard".to_string(),
        });
    }

    // Get file name for dialog message
    let file_path = get_window_file_path(app, window_label)?;
    let _file_name = file_path
        .as_ref()
        .and_then(|path| path.split('/').last())
        .unwrap_or("this drawing");

    // For now, return a placeholder - the frontend should handle the actual dialog
    // This is because the Tauri dialog API uses callbacks which don't work well with async commands
    Ok(CloseConfirmationResult {
        action: "pending".to_string(),
    })
}

/// Reset window to created state
#[tauri::command]
pub fn reset_window_created(app: AppHandle, window_label: String) -> Result<(), String> {
    let states = get_window_states(&app);

    let mut states_guard = states.window_states.lock().map_err(|e| e.to_string())?;

    // Remove the window state (will be recreated with initial state)
    states_guard.remove(&window_label);

    Ok(())
}
