import { useEffect, useState, useCallback } from 'react';
import { listen } from '@tauri-apps/api/event';
import type { InitialData } from '../types/open';

/**
 * Hook to handle loading Excalidraw drawing data from file operations.
 *
 * Features:
 * - Retrieves initialData from window.__excalidrawInitialData (set by openService)
 * - Listens for load-canvas-data event for data passed from parent window
 * - Cleans up the data after use to prevent reloading on refresh
 */
export function useFileLoader() {
  const [initialData, setInitialData] = useState<InitialData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let unlisten: (() => void) | undefined;

    async function loadData() {
      if (typeof window !== 'undefined') {
        // First, check if data was already stored (e.g., from event)
        const storedData = (window as any).__excalidrawInitialData;
        if (storedData) {
          try {
            setInitialData(storedData);
            console.log('Initial data loaded from storage:', {
              elementsCount: storedData.elements?.length || 0,
              hasAppState: !!storedData.appState,
            });
            // Clean up
            delete (window as any).__excalidrawInitialData;
            return;
          } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            setError(errorMessage);
            console.error('Failed to load stored data:', errorMessage);
            return;
          }
        }

        // Listen for load-canvas-data event (sent from parent window when creating new window)
        try {
          unlisten = await listen<InitialData>('load-canvas-data', (event) => {
            console.log('Load canvas data event received:', {
              elementsCount: event.payload.elements?.length || 0,
              hasAppState: !!event.payload.appState,
            });
            setInitialData(event.payload);
            // Store in window object as backup
            (window as any).__excalidrawInitialData = event.payload;
          });
        } catch (err) {
          console.error('Failed to set up event listener:', err);
        }
      }
    }

    loadData();

    return () => {
      if (unlisten) unlisten();
    };
  }, []);

  // Clear error state
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    initialData,
    error,
    clearError,
  };
}

export default useFileLoader;
