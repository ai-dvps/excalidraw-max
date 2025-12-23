import React, {useCallback, useRef, useEffect, useState} from 'react';
import {getCurrentWindow} from '@tauri-apps/api/window';
import {Excalidraw} from '@excalidraw/excalidraw';
import '@excalidraw/excalidraw/index.css';
import {ErrorBoundary} from './ErrorBoundary';
import {saveService} from '../services/saveService';
import {openService} from '../services/openService';
import {stateService} from '../services/stateService.ts';
import {useFileLoader} from '../hooks/useFileLoader';
import {useWindowCloseHandler} from '../hooks/useWindowCloseHandler';
import type {InitialData} from '../types/open';

// Type for Excalidraw API - using any to avoid type import issues
type ExcalidrawAPI = any;

// ============================================================================
// Change Detection Helpers - Zero Memory Allocation for Large Diagrams
// ============================================================================

/**
 * Calculate checksum from element versions.
 * O(N) integer math, zero memory allocation.
 * Excalidraw elements have a version property that increments on each change.
 */
function calculateElementsChecksum(elements: readonly any[]): number {
  let sum = 0;
  for (let i = 0; i < elements.length; i++) {
    // Include deleted elements - deleting is a change
    sum += elements[i].version;
  }
  return sum;
}

/**
 * Get hash of relevant appState properties.
 * Only includes visual/export properties that persist in the file.
 * Excludes: selection, scroll, zoom, view mode, etc.
 */
function getAppStateHash(appState: any): string {
  return JSON.stringify({
    viewBackgroundColor: appState.viewBackgroundColor,
    gridSize: appState.gridSize,
    name: appState.name,
    theme: appState.theme,
    // Only visual/export properties that persist in file
  });
}

/**
 * Simple debounce utility without lodash dependency.
 */
function debounce<T extends (...args: any[]) => void>(
  fn: T,
  delay: number
): T {
  let timeoutId: ReturnType<typeof setTimeout>;
  return ((...args: any[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  }) as T;
}

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

export function ExcalidrawCanvas({initialData: propInitialData}: ExcalidrawCanvasProps): React.ReactElement {
  const excalidrawAPI = useRef<ExcalidrawAPI | null>(null);

  // Window close handler for unsaved changes confirmation
  useWindowCloseHandler();

  // Track the "last saved" signature for comparison
  // Updated only on save/open, never on every change
  const savedSignatureRef = useRef<{
    elementsChecksum: number;
    appStateHash: string;
    filesCount: number;
  } | null>(null);

  // Use file loader hook to get initial data from file open operation
  const {initialData: fileInitialData, error: fileError} = useFileLoader();

  // Use prop data if provided, otherwise use file loader data
  const initialData = fileInitialData ?? propInitialData ?? null;

  // Track if data has been loaded to prevent duplicate loads
  const [dataLoaded, setDataLoaded] = useState(false);

  // Load drawing when both initialData is available AND Excalidraw API is ready
  useEffect(() => {
    console.log('updateScene effect running:', {
      hasInitialData: !!initialData,
      hasApi: !!excalidrawAPI.current,
      dataLoaded,
      elementsCount: initialData?.elements?.length || 0,
      filePath: initialData?.filePath || '(none)',
    });

    const loadDrawing = async () => {
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
        stateService.setSaved(getCurrentWindow().label, initialData.filePath);
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
    return {elements: [], appState: {}, files: {}};
  }, []);

  // Set up drawing data getter for save service
  useEffect(() => {
    saveService.setDrawingDataGetter(getDrawingData);
  }, [getDrawingData]);

  // Debounced change checker - runs after user stops interacting for 500ms
  const checkForChanges = useCallback(
    debounce((elements: readonly any[], appState: any, files: Record<string, unknown>) => {
      if (!elements || !appState) return;

      // Initialize saved signature on first run (document just opened/created)
      if (savedSignatureRef.current === null) {
        savedSignatureRef.current = {
          elementsChecksum: calculateElementsChecksum(elements),
          appStateHash: getAppStateHash(appState),
          filesCount: Object.keys(files || {}).length,
        };
        return;
      }

      // Compare against saved signature
      const currentChecksum = calculateElementsChecksum(elements);
      const currentAppStateHash = getAppStateHash(appState);
      const currentFilesCount = Object.keys(files || {}).length;

      const hasChanged =
        currentChecksum !== savedSignatureRef.current.elementsChecksum ||
        currentAppStateHash !== savedSignatureRef.current.appStateHash ||
        currentFilesCount !== savedSignatureRef.current.filesCount;

      if (hasChanged) {
        stateService.setEdited(getCurrentWindow().label);
      }
    }, 500), // 500ms debounce for UI responsiveness
    []
  );

  const handleChange = useCallback(
    (elements: readonly any[], appState: any, files: Record<string, unknown>) => {
      checkForChanges(elements, appState, files);
    },
    [checkForChanges]
  );

  const handleExcalidrawAPI = useCallback((api: ExcalidrawAPI) => {
    excalidrawAPI.current = api;
    console.log('Excalidraw API available');
  }, []);

  // Update the saved signature - call this after save/open
  const updateSavedSignature = useCallback(() => {
    if (excalidrawAPI.current) {
      const elements = excalidrawAPI.current.getSceneElements();
      const appState = excalidrawAPI.current.getAppState();
      const files = excalidrawAPI.current.getFiles();

      savedSignatureRef.current = {
        elementsChecksum: calculateElementsChecksum(elements),
        appStateHash: getAppStateHash(appState),
        filesCount: Object.keys(files).length,
      };
      console.log('[Change Detection] Saved signature updated');
    }
  }, []);

  // Set up integration with save service
  useEffect(() => {
    return saveService.onAfterSave(updateSavedSignature);
  }, [updateSavedSignature]);

  // Set up integration with open service
  useEffect(() => {
    return openService.onAfterOpen(updateSavedSignature);
  }, [updateSavedSignature]);

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
