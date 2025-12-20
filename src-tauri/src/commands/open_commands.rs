//! Open commands for reading Excalidraw files.
//!
//! Provides Tauri commands for reading and validating Excalidraw JSON files.

use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use tauri::AppHandle;

/// Result of loading an Excalidraw file.
#[derive(Debug, Serialize, Deserialize)]
pub struct LoadResult {
    pub success: bool,
    pub data: Option<ExcalidrawFile>,
    pub error: Option<String>,
}

/// Excalidraw file data structure.
#[derive(Debug, Serialize, Deserialize)]
pub struct ExcalidrawFile {
    pub elements: Vec<serde_json::Value>,
    pub app_state: serde_json::Value,
    pub files: serde_json::Value,
}

/// Request payload for read_drawing_file command.
#[derive(Deserialize)]
pub struct ReadDrawingRequest {
    pub path: String,
}

/// Read an Excalidraw file from the local filesystem.
///
/// Validates JSON structure and returns the drawing data.
/// Emits appropriate events for frontend state management.
#[tauri::command]
pub async fn read_drawing_file(_app: AppHandle, path: String) -> Result<LoadResult, String> {
    let path_buf = PathBuf::from(&path);

    // Check if file exists
    if !path_buf.exists() {
        return Ok(LoadResult {
            success: false,
            data: None,
            error: Some("File not found".to_string()),
        });
    }

    // Read file contents
    let json_data = match std::fs::read_to_string(&path_buf) {
        Ok(content) => content,
        Err(e) => {
            return Ok(LoadResult {
                success: false,
                data: None,
                error: Some(format!("Failed to read file: {}", e)),
            });
        }
    };

    // Parse JSON
    let parsed: serde_json::Value = match serde_json::from_str(&json_data) {
        Ok(value) => value,
        Err(_) => {
            return Ok(LoadResult {
                success: false,
                data: None,
                error: Some("File is not a valid JSON file".to_string()),
            });
        }
    };

    // Validate it's an object (dictionary)
    if !parsed.is_object() {
        return Ok(LoadResult {
            success: false,
            data: None,
            error: Some("File is not an Excalidraw drawing".to_string()),
        });
    }

    // Extract and validate elements array
    let elements = parsed
        .get("elements")
        .and_then(|v| v.as_array())
        .cloned()
        .unwrap_or_default();

    // Extract appState
    let app_state = parsed
        .get("appState")
        .cloned()
        .unwrap_or(serde_json::json!({}));

    // Extract files
    let files = parsed
        .get("files")
        .cloned()
        .unwrap_or(serde_json::json!({}));

    // Extract version (optional)
    let _version = parsed
        .get("version")
        .and_then(|v| v.as_number())
        .map(|n| n.as_u64().unwrap_or(0) as i32);

    Ok(LoadResult {
        success: true,
        data: Some(ExcalidrawFile {
            elements,
            app_state,
            files,
        }),
        error: None,
    })
}
