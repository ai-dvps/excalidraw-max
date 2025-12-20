import React, { useCallback } from 'react';
import { Excalidraw } from '@excalidraw/excalidraw';
import '@excalidraw/excalidraw/index.css';
import { ErrorBoundary } from './ErrorBoundary';

/**
 * ExcalidrawCanvas - Wrapper component for Excalidraw integration.
 * Renders a full-window Excalidraw canvas with error boundary protection.
 *
 * Features:
 * - Blank canvas on launch (initialData={null})
 * - Full-window container sizing
 * - Error boundary with retry button on initialization failure
 */
export function ExcalidrawCanvas(): React.ReactElement {
  const handleChange = useCallback((_elements: any, _appState: any, _files: any) => {
    // Canvas changed - not persisted in this version
    // Hook for future auto-save feature
  }, []);

  return (
    <ErrorBoundary>
      <div
        style={{
          height: '100vh',
          width: '100%',
          overflow: 'hidden',
        }}
      >
        <Excalidraw
          initialData={null}
          onChange={handleChange}
          UIOptions={{
            // Hide canvas actions that require persistence
            canvasActions: {
              loadScene: false,
              export: false,
              toggleTheme: true,
            },
          }}
        />
      </div>
    </ErrorBoundary>
  );
}

export default ExcalidrawCanvas;
