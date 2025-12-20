import React, { useCallback, useRef } from 'react';
import { Excalidraw } from '@excalidraw/excalidraw';
import '@excalidraw/excalidraw/index.css';
import { ErrorBoundary } from './ErrorBoundary';
import { useSaveState } from './SaveStateContext';
import { saveService } from '../services/saveService';
import { useFileLoader } from '../hooks/useFileLoader';
import type { InitialData } from '../types/open';

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
 * - File loading via open dialog (initialData passed as prop or loaded from window)
 */
interface ExcalidrawCanvasProps {
  /** Initial drawing data to load (optional) */
  initialData?: InitialData | null;
}

export function ExcalidrawCanvas({ initialData: propInitialData }: ExcalidrawCanvasProps): React.ReactElement {
  const excalidrawAPI = useRef<ExcalidrawAPI | null>(null);
  const { markUnsaved } = useSaveState();

  // Use file loader hook to get initial data from file open operation
  const { initialData: fileInitialData, isLoading: isLoadingFile, error: fileError } = useFileLoader();

  // Use prop data if provided, otherwise use file loader data
  const initialData = propInitialData ?? fileInitialData ?? null;

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
        {isLoadingFile ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              fontSize: '16px',
              color: '#666',
            }}
          >
            Loading drawing...
          </div>
        ) : fileError ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              fontSize: '16px',
              color: '#d32f2f',
            }}
          >
            <p>Failed to load drawing: {fileError}</p>
          </div>
        ) : (
          <Excalidraw
            initialData={initialData as any}
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
        )}
      </div>
    </ErrorBoundary>
  );
}

export default ExcalidrawCanvas;
