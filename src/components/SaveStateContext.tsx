/**
 * Save State Context for Excalidraw Application
 *
 * Provides React context for managing save state across components.
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { saveService } from '../services/saveService';
import type { SaveState } from '../types/save';

// Context type
interface SaveStateContextValue {
  saveState: SaveState;
  save: () => Promise<boolean>;
  markUnsaved: () => void;
  isSaving: boolean;
  hasUnsavedChanges: boolean;
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
    const cleanup = saveService.init();
    setIsInitialized(true);

    // Set up state listener
    const interval = setInterval(() => {
      setSaveState(saveService.getState());
    }, 100);

    return () => {
      cleanup();
      clearInterval(interval);
    };
  }, []);

  const save = useCallback(async () => {
    return saveService.triggerSave();
  }, []);

  const markUnsaved = useCallback(() => {
    saveService.markUnsaved();
    setSaveState(saveService.getState());
  }, []);

  const value: SaveStateContextValue = {
    saveState,
    save,
    markUnsaved,
    isSaving: saveState.isSaving,
    hasUnsavedChanges: saveState.hasUnsavedChanges,
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

/**
 * Hook to access save state.
 */
export function useSaveState() {
  const context = useContext(SaveStateContext);
  if (context === undefined) {
    throw new Error('useSaveState must be used within a SaveStateProvider');
  }
  return context;
}

/**
 * Hook to access save functionality.
 */
export function useSave() {
  const { save, markUnsaved, saveState } = useSaveState();
  return {
    save,
    markUnsaved,
    hasUnsavedChanges: saveState.hasUnsavedChanges,
    isSaving: saveState.isSaving,
    currentFilePath: saveState.currentFilePath,
    lastSavedAt: saveState.lastSavedAt,
  };
}
