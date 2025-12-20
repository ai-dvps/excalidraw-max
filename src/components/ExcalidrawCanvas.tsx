import React, { useCallback, useRef } from 'react';
import { Excalidraw } from '@excalidraw/excalidraw';
import '@excalidraw/excalidraw/index.css';
import { ErrorBoundary } from './ErrorBoundary';
import { useSaveState } from './SaveStateContext';
import { saveService } from '../services/saveService';

// Type for Excalidraw API - using any to avoid type import issues
type ExcalidrawAPI = any;

/**
 * ExcalidrawCanvas - Wrapper component for Excalidraw integration.
 * Renders a full-window Excalidraw canvas with error boundary protection.
 *
 * Features:
 * - Blank canvas on launch (initialData={null})
 * - Full-window container sizing
 * - Error boundary with retry button on initialization failure
 * - Save integration via menu and keyboard shortcut
 */
export function ExcalidrawCanvas(): React.ReactElement {
  const excalidrawAPI = useRef<ExcalidrawAPI | null>(null);
  const { markUnsaved } = useSaveState();

  // Get drawing data from Excalidraw for save operations
  const getDrawingData = useCallback(async () => {
    if (excalidrawAPI.current) {
      return {
        elements: excalidrawAPI.current.getSceneElements(),
        appState: excalidrawAPI.current.getAppState(),
        files: excalidrawAPI.current.getFiles(),
      };
    }
    return { elements: [], appState: {}, files: {} };
  }, []);

  // Set up drawing data getter for save service
  React.useEffect(() => {
    saveService.setDrawingDataGetter(getDrawingData);
  }, [getDrawingData]);

  const handleChange = useCallback(
    (_elements: any, _appState: any, _files: any) => {
      // Mark as unsaved when canvas changes
      markUnsaved();
    },
    [markUnsaved]
  );

  const handleExcalidrawAPI = useCallback((api: ExcalidrawAPI) => {
    excalidrawAPI.current = api;
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
          excalidrawAPI={handleExcalidrawAPI}
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
