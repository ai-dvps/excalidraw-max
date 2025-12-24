# Quickstart: User Settings Implementation

## Dependencies

Install required packages:

```bash
# Frontend
pnpm add antd @ant-design/icons

# Tauri plugins
pnpm tauri add store notification
```

Update `src-tauri/capabilities/default.json`:
```json
{
  "permissions": [
    "store:default",
    "notification:default"
  ]
}
```

## File Structure

```
src/
├── components/settings/
│   ├── index.ts              # Export all settings components
│   ├── SettingsModal.tsx     # Main modal wrapper
│   ├── SettingsSidebar.tsx   # Category navigation
│   ├── SettingsContent.tsx   # Dynamic content area
│   ├── EditorSettings.tsx    # Editor-specific settings
│   └── GeneralSettings.tsx   # Placeholder components
├── hooks/
│   ├── useSettings.ts        # Main settings hook
│   └── useSettingsForm.ts    # Form state management
├── services/
│   └── settingsService.ts    # Backend communication
└── types/
    └── settings.ts           # TypeScript interfaces

src-tauri/src/
├── commands/
│   └── settings_commands.rs  # Rust backend commands
└── lib.rs                    # Register commands
```

## Implementation Checklist

### Phase 1: Backend (Rust)

- [ ] Add Tauri store plugin to `Cargo.toml`
- [ ] Create `settings_commands.rs` with:
  - `load_settings()` - Returns UserSettings
  - `save_settings(settings: UserSettings)` - Persists to store
  - `reset_settings()` - Restores defaults
- [ ] Register commands in `lib.rs`
- [ ] Update capabilities in `default.json`

### Phase 2: Frontend Types

- [ ] Define `UserSettings` interface
- [ ] Define `EditorSettings` interface
- [ ] Define `SettingsCategory` type
- [ ] Export from `src/types/settings.ts`

### Phase 3: Settings Service

- [ ] Create `settingsService.ts`
- [ ] Implement `load()` - call `load_settings` command
- [ ] Implement `save(settings)` - call `save_settings` command
- [ ] Handle errors and notifications

### Phase 4: Settings Hook

- [ ] Create `useSettings` hook
- [ ] Load settings on mount
- [ ] Expose `settings`, `save`, `reset`
- [ ] Subscribe to store changes (optional)

### Phase 5: UI Components

- [ ] Create `SettingsModal.tsx` using Ant Design Modal
- [ ] Create `SettingsSidebar.tsx` using Ant Design Menu
- [ ] Create `SettingsContent.tsx` for dynamic rendering
- [ ] Create `EditorSettings.tsx` with ColorPicker
- [ ] Create placeholder components for other categories

### Phase 6: Menu Integration

- [ ] Add "Settings..." menu item under App menu
- [ ] Bind `Cmd+,` / `Ctrl+,` shortcut
- [ ] Connect to `SettingsModal` visibility

### Phase 7: Error Handling

- [ ] Add notification toast on corrupted settings file
- [ ] Implement fallback to default settings
- [ ] Log errors for debugging

## Testing Strategy

### Unit Tests

```typescript
// settings.test.ts
describe('Settings Validation', () => {
  it('validates hex color format', () => {
    expect(isValidHexColor('#ffffff')).toBe(true)
    expect(isValidHexColor('#fff')).toBe(true)
    expect(isValidHexColor('invalid')).toBe(false)
  })

  it('loads default settings when file missing', async () => {
    const settings = await loadSettings()
    expect(settings.editor.defaultBackgroundColor).toBe('#ffffff')
  })
})
```

### Integration Tests

- Modal opens/closes correctly
- Save persists to store
- Cancel discards changes
- Color picker updates preview
- Notification appears on error

## Common Issues

### Store Not Loading

Ensure the store file path is correct. Use relative path from app config dir:

```typescript
const store = await Store.load('settings.json')  // Saved in app config
```

### Permission Denied for Notifications

Check permission before sending:

```typescript
const granted = await isPermissionGranted()
if (!granted) {
  await requestPermission()
}
```

### React State Not Updating

Use functional updates or force re-render:

```typescript
setSettings(prev => ({ ...prev, editor: newSettings.editor }))
```

## Debug Commands

```bash
# Check Tauri store contents
# In Rust: dbg!(&store)

# Test notification permissions
# Frontend: await isPermissionGranted()
```
