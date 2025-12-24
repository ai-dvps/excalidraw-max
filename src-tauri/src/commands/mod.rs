/// Save commands for the Excalidraw application.
///
/// This module provides Tauri commands for saving drawings to the local filesystem.
pub mod save_commands;

/// Open commands for the Excalidraw application.
///
/// This module provides Tauri commands for opening drawings from the local filesystem.
pub mod open_commands;

/// State commands for window state management.
///
/// This module provides Tauri commands for managing window save state.
pub mod state_commands;

/// Settings commands for user preferences management.
///
/// This module provides Tauri commands for loading, saving, and resetting user settings.
pub mod settings_commands;
