/**
 * Save State Context for Excalidraw Application
 *
 * Provides React context for managing save state across components.
 */

import React, { createContext, useEffect, useState } from 'react';
import { saveService } from '../services/saveService';
import { openService } from '../services/openService';
import { settingsService } from '../services/settingsService';
import type { SaveState } from '../types/save';

// Context type
interface SaveStateContextValue {
  saveState: SaveState;
  isSaving: boolean;
}

// Create context with undefined as default
const SaveStateContext = createContext<SaveStateContextValue | undefined>(undefined);

/**
 * Provider component for SaveState context.
 */
export function SaveStateProvider({ children }: { children: React.ReactNode }) {
  const [saveState, setSaveState] = useState<SaveState>(saveService.getState());
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Initialize save service
    const cleanupSave = saveService.init();

    // Initialize open service
    const cleanupOpen = openService.init();

    // Initialize settings service
    const cleanupSettings = settingsService.init();

    setIsInitialized(true);

    // Set up state listener
    const interval = setInterval(() => {
      setSaveState(saveService.getState());
    }, 100);

    return () => {
      cleanupSave();
      cleanupOpen();
      cleanupSettings();
      clearInterval(interval);
    };
  }, []);

  const value: SaveStateContextValue = {
    saveState,
    isSaving: saveState.isSaving,
  };

  // Don't render children until initialized
  if (!isInitialized) {
    return null;
  }

  return (
    <SaveStateContext.Provider value={value}>
      {children}
    </SaveStateContext.Provider>
  );
}
