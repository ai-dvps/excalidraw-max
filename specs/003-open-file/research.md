# Research: Open File Feature

## Decision: File Dialog Implementation

**Decision**: Use Tauri's native `open()` function from `@tauri-apps/plugin-dialog`

**Rationale**:
- Already installed via `tauri add dialog` for save functionality
- Provides native OS file picker dialogs
- Cross-platform support (macOS, Windows, Linux)
- Consistent with save dialog pattern used in `saveService.ts`

**Alternatives Considered**:
- Custom HTML file input: Not native, poor UX for desktop app
- Tauri Rust dialog plugin: Would require additional crate, less TypeScript integration

## Decision: File Reading Strategy

**Decision**: Read file via Rust command `read_drawing_file`

**Rationale**:
- Consistent with existing `save_drawing` command pattern
- Better error handling at Rust level
- Can validate JSON structure before returning to frontend
- Async/await compatible with Tauri

**Implementation**:
```rust
#[tauri::command]
async fn read_drawing_file(app: AppHandle, path: String) -> Result<LoadResult, String>
```

## Decision: Data Loading into Excalidraw

**Decision**: Use Excalidraw's `initialData` prop

**Rationale**:
- Native Excalidraw API for loading drawing data
- Accepts `{ elements, appState, files }` structure
- Can be async (Promise) for lazy loading
- No custom data transformation needed

**Usage**:
```typescript
<Excalidraw initialData={initialData} />
```

## Decision: Window Creation

**Decision**: Frontend triggers new Tauri window creation

**Rationale**:
- React controls UI state and component lifecycle
- Can pass `initialData` via window event or URL params
- Each window runs its own React instance

**Implementation**:
```typescript
import { WebviewWindow } from '@tauri-apps/api/window';

const window = new WebviewWindow('excalidraw-' + Date.now(), {
  url: '/',
  title: 'Excalidraw',
});
```

## Decision: Progress Indicator

**Decision**: Show progress indicator in React for large files

**Rationale**:
- UI responsibility, not backend
- Can use existing loading state in React
- Can show percentage, spinner, or indeterminate progress

**Implementation**: Add loading state to `openService.ts` and display in UI component.

## APIs Referenced

1. **Tauri Dialog**: https://v2.tauri.app/plugin/dialog/#open-a-file-selector-dialog
2. **Excalidraw Props**: https://docs.excalidraw.com/docs/@excalidraw/excalidraw/api/props
3. **Tauri Window**: https://v2.tauri.app/reference/javascript/api/window

## Open Questions Resolved

1. **Q: Should we use Rust or JavaScript for file reading?**
   - A: Use Rust command for consistency with save pattern

2. **Q: How to pass data to new window?**
   - A: Use window events (`emit('load-canvas-data', data)`)

3. **Q: How to handle file validation?**
   - A: Validate in Rust command, return structured error
