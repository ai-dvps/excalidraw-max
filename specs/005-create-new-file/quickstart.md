# Quickstart: Create New File Feature

## Integration Guide

### Menu Integration

Add "New" menu item to File menu in `src-tauri/src/lib.rs`:

```rust
// In create_app_menu(), add to file_menu:
// .text("new", "New")
```

### Menu Event Handler

Add handler in `app.on_menu_event()`:

```rust
"new" => {
    let _ = app_handle.emit("menu-new-triggered", ());
}
```

### Shortcut Integration

Add to global shortcut registration in `src-tauri/src/lib.rs`:

```rust
#[cfg(target_os = "macos")]
let new_shortcut = Shortcut::new(Some(Modifiers::SUPER), Code::KeyN);

#[cfg(not(target_os = "macos"))]
let new_shortcut = Shortcut::new(Some(Modifiers::CONTROL), Code::KeyN);

// Register with handler emitting "shortcut-new-triggered"
```

### Open Service Extension

Add `triggerNew()` method in `src/services/openService.ts`:

```typescript
async triggerNew(): Promise<boolean> {
  // Similar to triggerOpen() but with empty initialData
  const initialData: InitialData = {
    elements: [],
    appState: { viewBackgroundColor: settings.editor.defaultBackgroundColor },
    files: {},
    filePath: null,
  };
  return this.createNewWindow(initialData);
}
```

### Event Listeners

Add to `settingsService.init()` or create `openService.init()`:

```typescript
const unlistenMenuNew = listen('menu-new-triggered', async () => {
  this.triggerNew();
});

const unlistenShortcutNew = listen('shortcut-new-triggered', async () => {
  this.triggerNew();
});
```

## Testing Checklist

- [ ] Menu item "New" appears under File menu
- [ ] Ctrl+N (Win/Linux) opens new window
- [ ] Cmd+N (macOS) opens new window
- [ ] New window has blank canvas
- [ ] Settings (background color) applied to new window
- [ ] Multiple new windows can be created
- [ ] Window labels are unique (excalidraw-1, excalidraw-2, etc.)
