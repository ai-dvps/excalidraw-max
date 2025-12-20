# Research: Excalidraw Integration for Tauri Desktop App

**Date**: 2025-12-20 | **Feature**: Auto-create Excalidraw on App Open

## Excalidraw React Integration

### Installation
```bash
pnpm add @excalidraw/excalidraw
```

### Basic Usage
```tsx
import { Excalidraw } from "@excalidraw/excalidraw";
import "@excalidraw/excalidraw/index.css";

function App() {
  return (
    <div style={{ height: "100vh", width: "100%" }}>
      <Excalidraw />
    </div>
  );
}
```

### Key Props
- `initialData`: null for blank canvas (our use case)
- `onChange`: Callback when canvas changes (not needed for this feature)
- `excalidrawAPI`: Access to Excalidraw programmatic API
- `UIOptions`: Customize toolbar actions

### Container Requirements
Excalidraw MUST be rendered in a container with defined height. For Tauri desktop app, use `100vh` and `100%` to fill the window.

## Error Handling Strategy

### React Error Boundary
```tsx
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div>
          <p>Failed to load Excalidraw</p>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      );
    }
    return this.props.children;
  }
}
```

## Performance Considerations

### Lazy Loading (Optional Optimization)
```tsx
import { lazy, Suspense } from "react";
const Excalidraw = lazy(() => import("@excalidraw/excalidraw").then(mod => ({ default: mod.Excalidraw })));
```

For this feature, lazy loading is NOT recommended because:
- Users expect immediate canvas availability
- Error boundary provides adequate error handling
- Keeping it simple aligns with feature scope

## Decision: No Persistence

Based on clarification session:
- No local storage persistence
- Fresh blank canvas on every launch
- Auto-save deferred to future feature

## Alternatives Considered

| Approach | Chosen | Rationale |
|----------|--------|-----------|
| Lazy load Excalidraw | ❌ | Users want immediate canvas access |
| Local storage persistence | ❌ | Deferred to future feature |
| IndexedDB for canvas data | ❌ | Deferred to future feature |
| Error boundary with retry | ✅ | Provides graceful degradation |

## Best Practices Applied

1. **Container sizing**: Use 100vh/100% for full-window canvas
2. **Error boundary**: Protect against initialization failures
3. **No persistence**: Keep scope minimal for MVP
4. **Import CSS**: Include Excalidraw styles for proper rendering
