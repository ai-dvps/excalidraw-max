# Research: Create New File Feature

## Decision: Reuse Existing Architecture

### New File Pattern

**Decision**: Reuse existing `openService.createNewWindow()` pattern for creating new windows with empty canvas data.

**Rationale**:
- The existing `openService.ts` already has `createNewWindow()` method
- It already handles window creation via `create_window_with_data` Tauri command
- Empty canvas can be created by passing empty elements, appState, and files

**Alternatives Considered**:
- Create separate `newFileService.ts` - Rejected (duplicates functionality)
- Use `create_window_with_data` directly in menu handler - Works but less maintainable

### Settings Application

**Decision**: Settings are applied via existing Excalidraw `initialData` mechanism.

**Rationale**:
- Excalidraw already accepts `initialData` prop with `appState` containing visual settings
- `useSettings` hook already loads settings on mount
- Window label pattern already handles per-window state

**Alternatives Considered**:
- Apply settings after window opens via event - More complex, race conditions possible
- Global settings applied at app level - Doesn't work for per-window settings

### Menu Integration

**Decision**: Add "New" menu item to existing File menu in `lib.rs`.

**Rationale**:
- File menu already exists with Open, Save, Save As
- Menu event handler already emits `menu-new-triggered` pattern
- Consistent with existing Save/Open menu items

### Shortcut Integration

**Decision**: Register Ctrl+N (Win/Linux) and Cmd+N (macOS) via global shortcut plugin.

**Rationale**:
- Global shortcut plugin already in use for Save/Open/Settings shortcuts
- Platform-dependent shortcut handling already exists in `lib.rs`
- Shortcut patterns already established

## Best Practices Applied

1. **Window Label Generation**: Follows existing `excalidraw-*` pattern
2. **Event Emission**: Uses same pattern as `menu-open-triggered`
3. **State Management**: Uses existing `stateService` for window state
4. **Settings Persistence**: Uses existing `settingsService` patterns
