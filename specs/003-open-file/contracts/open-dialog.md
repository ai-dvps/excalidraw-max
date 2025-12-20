# Contract: Open File Flow

## Frontend → Backend: Read Drawing File

### TypeScript (Frontend)

```typescript
import { open } from '@tauri-apps/plugin-dialog';
import { invoke } from '@tauri-apps/api/core';
import type { LoadResult } from '../../types/open';

interface OpenFileOptions {
  filters?: Array<{ name: string; extensions: string[] }>;
}

async function openFile(options: OpenFileOptions = {}): Promise<LoadResult> {
  // Step 1: Show native open dialog
  const filePath = await open({
    multiple: false,
    directory: false,
    filters: options.filters || [
      { name: 'Excalidraw', extensions: ['excalidraw', 'json'] },
      { name: 'JSON', extensions: ['json'] },
      { name: 'All Files', extensions: ['*'] },
    ],
  });

  if (!filePath) {
    // User cancelled
    return { success: false };
  }

  // Step 2: Invoke Rust command to read file
  const result = await invoke<LoadResult>('read_drawing_file', { path: filePath });
  return result;
}
```

### Rust (Backend)

```rust
use serde::{Deserialize, Serialize};
use std::path::PathBuf;

#[derive(Debug, Serialize, Deserialize)]
pub struct LoadResult {
    pub success: bool,
    pub data: Option<ExcalidrawFile>,
    pub error: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ExcalidrawFile {
    pub elements: Vec<serde_json::Value>,
    pub app_state: serde_json::Value,
    pub files: serde_json::Value,
}

#[tauri::command]
async fn read_drawing_file(
    app: tauri::AppHandle,
    path: String,
) -> Result<LoadResult, String> {
    let path_buf = PathBuf::from(&path);

    // Read file
    let json_data = std::fs::read_to_string(&path_buf)
        .map_err(|e| format!("Failed to read file: {}", e))?;

    // Parse JSON
    let parsed: serde_json::Value = serde_json::from_str(&json_data)
        .map_err(|_| "File is not a valid JSON file".to_string())?;

    // Validate structure
    if !parsed.is_object() {
        return Ok(LoadResult {
            success: false,
            data: None,
            error: Some("File is not an Excalidraw drawing".to_string()),
        });
    }

    // Extract elements
    let elements = parsed.get("elements")
        .and_then(|v| v.as_array())
        .cloned()
        .unwrap_or_default();

    let app_state = parsed.get("appState")
        .cloned()
        .unwrap_or(serde_json::json!({}));

    let files = parsed.get("files")
        .cloned()
        .unwrap_or(serde_json::json!({}));

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
```

## Frontend → Tauri: Create New Window

```typescript
import { WebviewWindow } from '@tauri-apps/api/window';

async function createNewWindow(initialData: InitialData): Promise<void> {
  const webview = new WebviewWindow('excalidraw-' + Date.now(), {
    url: '#/canvas',
    title: 'Excalidraw',
    width: 800,
    height: 600,
  });

  // Wait for window to be ready, then send initial data
  await webview.once('tauri://created', () => {
    webview.emit('load-canvas-data', initialData);
  });
}
```

## Events

| Event | Direction | Payload | Description |
|-------|-----------|---------|-------------|
| `load-canvas-data` | Frontend → Frontend | `InitialData` | Send loaded data to new window |
| `window-ready-for-data` | Frontend → Frontend | `void` | New window signals it's ready |
| `open-error` | Frontend → UI | `{ message: string }` | Display error to user |

## Error Codes

| Code | Message | Description |
|------|---------|-------------|
| `FILE_NOT_FOUND` | File not found | Path is invalid |
| `INVALID_JSON` | File is not a valid JSON file | Parse failed |
| `INVALID_FORMAT` | File is not an Excalidraw drawing | Missing required fields |
| `CORRUPTED` | Drawing file is corrupted | Partial data or unknown version |
