# Contracts: Auto-create Excalidraw on App Open

**Feature**: Auto-create Excalidraw on App Open

## Frontend Contracts

This feature is purely frontend. No backend API contracts are required.

### Component Interface

```
ExcalidrawCanvas (React Component)
├── Props: none required
├── Returns: React element with Excalidraw canvas
└── Side Effects: none (transient canvas only)
```

### Error Boundary Interface

```
ErrorFallback (React Component)
├── Props: { onRetry: () => void }
└── Returns: Error UI with retry button
```

## No Backend Commands Needed

Per feature scope and clarification:
- No Tauri commands required
- No Rust backend changes
- No file system access
- No persistence layer

## Component Props Contract

### Excalidraw Component

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| initialData | null | Yes | Blank canvas on launch |
| UIOptions | object | No | Customize toolbar |

### Error Boundary

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| onRetry | function | Yes | Callback to retry initialization |
