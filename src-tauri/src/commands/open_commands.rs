//! Open commands for reading Excalidraw files.
//!
//! Provides Tauri commands for reading and creating windows with Excalidraw files.

use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use tauri::{AppHandle, Emitter, Manager, WebviewUrl, WebviewWindowBuilder};

/// Result of loading an Excalidraw file.
#[derive(Debug, Serialize, Deserialize)]
pub struct LoadResult {
    pub success: bool,
    pub data: Option<ExcalidrawFile>,
    pub error: Option<String>,
}

/// Excalidraw file data structure.
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ExcalidrawFile {
    pub elements: Vec<serde_json::Value>,
    pub app_state: serde_json::Value,
    pub files: serde_json::Value,
}

/// Drawing data to pass to new window.
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DrawingData {
    pub elements: Vec<serde_json::Value>,
    #[serde(rename = "appState")]
    pub app_state: serde_json::Value,
    pub files: serde_json::Value,
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

/// Result of window creation.
#[derive(Debug, Serialize, Deserialize)]
pub struct WindowResult {
    pub success: bool,
    pub error: Option<String>,
}

/// Create a new window with the given drawing data.
/// This is more reliable than creating windows from the frontend.
#[tauri::command()]
pub fn create_window_with_data(
    _app: AppHandle,
    elements: Vec<serde_json::Value>,
    app_state: serde_json::Value,
    files: serde_json::Value
) -> Result<WindowResult, String> {
    // Generate unique window label
    let window_count = _app.webview_windows().len();
    let window_label = format!("excalidraw-{}", window_count);

    println!("Creating new window with label: {}", window_label);

    // Create drawing data
    let drawing_data = DrawingData {
        elements,
        app_state,
        files,
    };

    // Create new window
    match WebviewWindowBuilder::new(
        &_app,
        &window_label,
        WebviewUrl::App("index.html".into()),
    )
    .title("Excalidraw")
    .inner_size(1000.0, 700.0)
    .resizable(true)
    .center()
    .devtools(true)
    .build()
    {
        Ok(window) => {
            println!("Window created successfully: {}", window_label);

            // Open devtools for debugging
            let _ = window.open_devtools();

            // Clone data for the JavaScript injection
            let data = drawing_data.clone();
            let data_json = serde_json::to_string(&data).unwrap_or_default();

            // Inject data directly into the new window's JavaScript context
            // This is more reliable than events for initial data
            let js_code = format!(
                r#"
                (function() {{
                    window.__excalidrawInitialData = {};
                    console.log('Initial data set from Rust');
                }})();
                "#,
                data_json
            );

            if let Err(e) = window.eval(&js_code) {
                println!("Failed to inject initial data: {}", e);
                // Fallback: emit event
                let _ = window.emit("load-canvas-data", data);
            } else {
                println!("Initial data injected into window: {}", window_label);
            }

            Ok(WindowResult { success: true, error: None })
        }
        Err(e) => {
            println!("Failed to create window: {}", e);
            Ok(WindowResult { success: false, error: Some(e.to_string()) })
        }
    }
}
