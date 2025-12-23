import { useEffect, useState, useCallback } from 'react';
import { listen } from '@tauri-apps/api/event';
import type { InitialData } from '../types/open';

/**
 * Hook to handle loading Excalidraw drawing data from file operations.
 *
 * Features:
 * - Retrieves initialData from window.__excalidrawInitialData (set by Rust)
 * - Listens for load-canvas-data event for data passed from parent window
 * - Polls for data if not immediately available (handles async injection)
 * - Cleans up the data after use to prevent reloading on refresh
 */
export function useFileLoader() {
  const [initialData, setInitialData] = useState<InitialData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let unlisten: (() => void) | undefined;
    let pollInterval: ReturnType<typeof setInterval> | undefined;

    async function checkForData() {
      if (typeof window !== 'undefined') {
        // Check if data was already stored (injected by Rust)
        const storedData = (window as any).__excalidrawInitialData;
        if (storedData) {
          try {
            setInitialData(storedData);
            console.log('Initial data loaded from storage:', {
              elementsCount: storedData.elements?.length || 0,
              hasAppState: !!storedData.appState,
              filePath: storedData.filePath,
            });
            // Clean up
            delete (window as any).__excalidrawInitialData;
            return true; // Data found
          } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            setError(errorMessage);
            console.error('Failed to load stored data:', errorMessage);
            return true; // Stop polling even on error
          }
        }
      }
      return false; // Data not found yet
    }

    async function loadData() {
      // First, check immediately
      if (await checkForData()) {
        return;
      }

      // Listen for load-canvas-data event (sent from Rust as fallback)
      try {
        unlisten = await listen<InitialData>('load-canvas-data', (event) => {
          console.log('Load canvas data event received:', {
            elementsCount: event.payload.elements?.length || 0,
            hasAppState: !!event.payload.appState,
            filePath: event.payload.filePath,
          });
          setInitialData(event.payload);
          // Store in window object as backup
          (window as any).__excalidrawInitialData = event.payload;
        });
      } catch (err) {
        console.error('Failed to set up event listener:', err);
      }

      // Poll for data injection (in case Rust already injected it)
      pollInterval = setInterval(async () => {
        if (await checkForData()) {
          if (pollInterval) {
            clearInterval(pollInterval);
            pollInterval = undefined;
          }
          if (unlisten) {
            unlisten();
            unlisten = undefined;
          }
        }
      }, 50); // Check every 50ms for up to 5 seconds

      // Stop polling after 5 seconds to avoid memory leaks
      setTimeout(() => {
        if (pollInterval) {
          clearInterval(pollInterval);
          pollInterval = undefined;
        }
      }, 5000);
    }

    loadData();

    return () => {
      if (unlisten) unlisten();
      if (pollInterval) clearInterval(pollInterval);
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
