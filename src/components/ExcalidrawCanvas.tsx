import React, { useCallback, useRef, useEffect, useState } from 'react';
import { Excalidraw } from '@excalidraw/excalidraw';
import '@excalidraw/excalidraw/index.css';
import { ErrorBoundary } from './ErrorBoundary';
import { useSaveState } from './SaveStateContext';
import { saveService } from '../services/saveService';
import { useFileLoader } from '../hooks/useFileLoader';
import { useWindowState } from '../hooks/useWindowState';
import { useWindowCloseHandler } from '../hooks/useWindowCloseHandler';
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
 * - File loading via open dialog (uses updateScene API for dynamic loading)
 */
interface ExcalidrawCanvasProps {
  /** Initial drawing data to load (optional) */
  initialData?: InitialData | null;
}

export function ExcalidrawCanvas({ initialData: propInitialData }: ExcalidrawCanvasProps): React.ReactElement {
  const excalidrawAPI = useRef<ExcalidrawAPI | null>(null);
  const { markUnsaved } = useSaveState();

  // Window state hook for state machine
  const { setEdited } = useWindowState();

  // Window close handler for unsaved changes confirmation
  useWindowCloseHandler();

  // Use file loader hook to get initial data from file open operation
  const { initialData: fileInitialData, error: fileError } = useFileLoader();

  // Use prop data if provided, otherwise use file loader data
  const initialData = propInitialData ?? fileInitialData ?? null;

  // Track if data has been loaded to prevent duplicate loads
  const [dataLoaded, setDataLoaded] = useState(false);

  // Load drawing when both initialData is available AND Excalidraw API is ready
  useEffect(() => {
    console.log('updateScene effect running:', {
      hasInitialData: !!initialData,
      hasApi: !!excalidrawAPI.current,
      dataLoaded,
      elementsCount: initialData?.elements?.length || 0,
    });

    const loadDrawing = () => {
      if (initialData && excalidrawAPI.current && !dataLoaded) {
        console.log('Loading drawing via updateScene:', {
          elementsCount: initialData.elements?.length || 0,
          hasAppState: !!initialData.appState && Object.keys(initialData.appState).length > 0,
        });

        // Use updateScene API to load the data
        excalidrawAPI.current.updateScene({
          elements: initialData.elements || [],
          appState: initialData.appState || {},
          files: initialData.files || {},
          captureUpdate: 'IMMEDIATELY' as any,
        });

        setDataLoaded(true);
        console.log('Drawing loaded successfully');
      }
    };

    // Try to load immediately
    loadDrawing();

    // Also set up an observer in case API becomes available later
    const checkInterval = setInterval(() => {
      if (!dataLoaded && excalidrawAPI.current && initialData) {
        console.log('Retrying load - API now available');
        loadDrawing();
        clearInterval(checkInterval);
      }
    }, 50);

    // Clear interval on cleanup
    return () => clearInterval(checkInterval);
  }, [initialData, dataLoaded]);

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
  useEffect(() => {
    saveService.setDrawingDataGetter(getDrawingData);
  }, [getDrawingData]);

  const handleChange = useCallback(
    (_elements: any, _appState: any, _files: any) => {
      // Mark as unsaved when canvas changes (legacy save service)
      markUnsaved();
      // Update window state to "edited" (new state machine)
      setEdited();
    },
    [markUnsaved, setEdited]
  );

  const handleExcalidrawAPI = useCallback((api: ExcalidrawAPI) => {
    excalidrawAPI.current = api;
    console.log('Excalidraw API available');
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
        {fileError ? (
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
            // Use null for initialData since we load via updateScene
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
        )}
      </div>
    </ErrorBoundary>
  );
}

export default ExcalidrawCanvas;
