# Quickstart: Auto-create Excalidraw Feature

**Feature**: Auto-create Excalidraw on App Open

## Prerequisites

1. Tauri development environment set up
2. Node.js and pnpm installed
3. Git feature branch checked out: `001-auto-create-excalidraw`

## Installation

```bash
# Install Excalidraw dependency
pnpm add @excalidraw/excalidraw
```

## Development

```bash
# Start Vite dev server
pnpm dev

# Open in browser at http://localhost:1420
# Or run Tauri dev mode
pnpm tauri dev
```

## File Changes Summary

| File | Action |
|------|--------|
| `package.json` | Add @excalidraw/excalidraw dependency |
| `src/App.tsx` | Replace with Excalidraw canvas |
| `src/App.css` | Add canvas container styles |
| `src/components/ExcalidrawCanvas.tsx` | New - wrapper component |
| `src/components/ErrorBoundary.tsx` | New - error boundary |

## Testing

```bash
# Run TypeScript check
pnpm build

# Preview build
pnpm preview
```

## Expected Behavior

1. App launches with blank Excalidraw canvas
2. Canvas fills entire Tauri window
3. All Excalidraw tools are available
4. Drawing works immediately (no extra clicks)
5. On error: shows dialog with retry button
6. On close: canvas data is discarded (no persistence)
