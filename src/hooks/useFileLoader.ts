import { useEffect, useState, useCallback } from 'react';
import type { InitialData } from '../types/open';

/**
 * Hook to handle loading Excalidraw drawing data from file operations.
 *
 * Features:
 * - Retrieves initialData from window.__excalidrawInitialData (set by openService)
 * - Cleans up the data after use to prevent reloading on refresh
 * - Returns loading state and the loaded data
 */
export function useFileLoader() {
  const [initialData, setInitialData] = useState<InitialData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load initial data from window object (set by openService when creating new window)
  useEffect(() => {
    // Check if there's initial data from file open operation
    if (typeof window !== 'undefined') {
      const excalidrawData = (window as any).__excalidrawInitialData;

      if (excalidrawData) {
        setIsLoading(true);
        try {
          setInitialData(excalidrawData);
          console.log('Initial data loaded from file:', {
            elementsCount: excalidrawData.elements?.length || 0,
            hasAppState: !!excalidrawData.appState,
          });

          // Clean up to prevent reloading on hot reload or navigation
          delete (window as any).__excalidrawInitialData;
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : String(err);
          setError(errorMessage);
          console.error('Failed to load initial data:', errorMessage);
        } finally {
          setIsLoading(false);
        }
      }
    }
  }, []);

  // Clear error state
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    initialData,
    isLoading,
    error,
    clearError,
  };
}

export default useFileLoader;
