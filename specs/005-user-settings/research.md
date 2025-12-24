# Research: User Settings Implementation

## Tauri Store Plugin

**Decision**: Use Tauri store plugin for settings persistence.

**Rationale**: The Tauri store plugin provides a simple key-value store that automatically persists to a JSON file. It supports:
- Type-safe get/set operations with generics
- Change listeners for reactive updates
- Manual save/load control when needed
- Integration with the existing Tauri plugin ecosystem

**Implementation Pattern**:
```typescript
import { Store } from '@tauri-apps/plugin-store'

const store = await Store.load('settings.json')
await store.set('editor.defaultBackgroundColor', '#ffffff')
const color = await store.get<string>('editor.defaultBackgroundColor')
```

**Key Features Used**:
- `Store.load('settings.json')` - Initialize store on app startup
- `store.set(key, value)` - Persist setting changes
- `store.get<T>(key)` - Retrieve settings with type safety
- `store.onKeyChange(key, callback)` - Reactive updates for useSettings hook

## Tauri Notification Plugin

**Decision**: Use Tauri notification plugin for error notifications.

**Rationale**: Native OS notifications provide better visibility than in-app toasts. The plugin handles:
- Permission checking and requesting
- Platform-specific notification delivery
- Optional sound and icon support

**Implementation Pattern**:
```typescript
import { isPermissionGranted, requestPermission, sendNotification } from '@tauri-apps/plugin-notification'

async function notifySettingsReset() {
  let granted = await isPermissionGranted()
  if (!granted) {
    granted = (await requestPermission()) === 'granted'
  }
  if (granted) {
    sendNotification({
      title: 'Settings Reset',
      body: 'Settings file was corrupted. Default settings have been loaded.'
    })
  }
}
```

## Ant Design UI Components

**Decision**: Use Ant Design components as specified in the requirements.

**Key Components**:
- `Modal` - Settings dialog with cancel/save buttons
- `Menu` - Category navigation sidebar
- `ColorPicker` - Editor background color selection
- `Button` - Form actions
- `Layout` - Two-column layout structure

**Modal Pattern**:
```typescript
import { Modal } from 'antd'

<Modal
  title="Settings"
  open={isOpen}
  onCancel={handleCancel}
  onOk={handleSave}
  okText="Save"
  cancelText="Cancel"
>
  {/* Settings content */}
</Modal>
```

## React Settings Hook Pattern

**Decision**: Implement `useSettings` hook that:
1. Loads settings from Tauri store on mount
2. Exposes settings state to components
3. Provides save/cancel methods
4. Updates all subscribers when settings change

**Pattern**:
```typescript
function useSettings() {
  const [settings, setSettings] = useState<UserSettings>(defaultSettings)

  useEffect(() => {
    const load = async () => {
      const loaded = await settingsService.load()
      setSettings(loaded)
    }
    load()
  }, [])

  const save = async (newSettings: UserSettings) => {
    await settingsService.save(newSettings)
    setSettings(newSettings)
  }

  return { settings, save }
}
```

## Alternatives Considered

1. **React Context for settings state**: Rejected - Context doesn't persist across app restarts
2. **LocalStorage**: Rejected - Tauri store provides better type safety and Rust backend validation
3. **Custom JSON file handling**: Rejected - Tauri store plugin handles file locking, validation, and change tracking

## References

- Tauri Store Plugin: https://v2.tauri.app/plugin/store/
- Tauri Notification Plugin: https://v2.tauri.app/plugin/notification/
- Ant Design Components: https://ant-design.antgroup.com/components/overview/
