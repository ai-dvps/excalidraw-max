# Research: Save Menu Item Implementation

## Research Questions

1. How to create a native menu with a Save item in Tauri v2?
2. How to register keyboard shortcuts (Cmd+S / Ctrl+S) in Tauri v2?
3. How to handle file dialogs for saving in Tauri?

## Findings

### Tauri v2 Menu API

Tauri v2 provides a native menu system through `tauri::menu` module. Key points:

- **Menu Creation**: Use `MenuBuilder::new(app)` to create menus
- **Submenus**: Use `SubmenuBuilder::new(app, "File")` for File menu
- **Menu Items**: Use `MenuItemBuilder::with_id("save", "Save")` for clickable items
- **Accelerators**: Set keyboard shortcuts via `.accelerator("CmdOrControl+S")`
- **Event Handling**: Use `app.on_menu_event()` to handle clicks

### Tauri v2 Global Shortcut Plugin

For global keyboard shortcuts that work outside menu focus:

- **Plugin**: `tauri-plugin-global-shortcut`
- **Registration**: `app.global_shortcut().register(shortcut)?`
- **Shortcuts**: Use `Shortcut::new(Some(Modifiers), Code::KeyX)` format
- **Handler**: Callback fires on key press/release events

### Platform-Specific Shortcuts

Tauri uses `CmdOrControl` modifier which automatically selects:
- **macOS**: Command key (⌘)
- **Windows/Linux**: Control key (Ctrl)

### File Dialog for Saving

Tauri provides `dialog::save()` API:
- Returns selected path as `Option<PathBuf>`
- User can choose file location and format
- Returns `None` if user cancels

## Technical Decisions

| Decision | Selected | Rationale |
|----------|----------|-----------|
| Menu Implementation | Rust API | Native integration, event handling built-in |
| Shortcut Registration | Menu accelerator + global shortcut | Best UX: visual indicator + works when menu not focused |
| File Dialog | Tauri dialog API | Secure, native file picker |
| Path Storage | Rust side (AppHandle) | Secure, survives browser refresh |

## Code Examples

### Creating File Menu with Save

```rust
use tauri::menu::{MenuBuilder, MenuItemBuilder, SubmenuBuilder};

let save_item = MenuItemBuilder::with_id("save", "Save")
    .accelerator("CmdOrControl+S")?
    .build(app)?;

let file_menu = SubmenuBuilder::new(app, "File")
    .item(&save_item)
    .separator()
    .text("quit", "Quit")
    .build()?;

let menu = MenuBuilder::new(app).items(&[&file_menu]).build()?;
app.set_menu(menu)?;
```

### Registering Global Shortcut

```rust
use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut, ShortcutState};

let save_shortcut = Shortcut::new(Some(Modifiers::CONTROL), Code::KeyS);
app.handle().plugin(
    tauri_plugin_global_shortcut::Builder::new()
        .with_handler(move |_app, shortcut, event| {
            if shortcut == &save_shortcut && event.state() == ShortcutState::Pressed {
                // Invoke save command
            }
        })
        .build(),
)?;
app.global_shortcut().register(save_shortcut)?;
```

### Save Command with Dialog

```rust
#[tauri::command]
async fn save_drawing(app: AppHandle, json_data: String) -> Result<PathBuf, String> {
    let path = dialog::save(|new_path| {
        // Filter options
        dialog::file_selection(
            new_path,
            dialog::FileDialogBuilder::new().set_title("Save Drawing"),
        )
    }).await;

    match path {
        Some(path) => {
            // Write to file
            std::fs::write(&path, json_data)?;
            Ok(path)
        }
        None => Err("Save cancelled".to_string()),
    }
}
```

## Resources

- [Tauri Window Menu Documentation](https://v2.tauri.app/learn/window-menu/)
- [Tauri Global Shortcut Plugin](https://v2.tauri.app/plugin/global-shortcut/)
- [Tauri Dialog API](https://v2.tauri.app/plugin/dialog/)
