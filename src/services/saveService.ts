/**
 * Save Service for Excalidraw Application
 *
 * Provides save functionality with smart save behavior:
 * - First save: prompts for file path
 * - Subsequent saves: use existing path
 */

import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import type { SaveState, SaveResult } from '../types/save';

// Module-level state
let currentSaveState: SaveState = {
  hasUnsavedChanges: false,
  currentFilePath: null,
  lastSavedAt: null,
  isSaving: false,
};

// Event listeners cleanup functions
let listeners: (() => void)[] = [];

/**
 * Get drawing data from the stored getter or return empty data.
 */
async function getDrawingData(): Promise<unknown> {
  if (typeof window !== 'undefined') {
    const getter = (window as any).__excalidrawDrawingDataGetter;
    if (getter) {
      return getter();
    }
  }
  return { elements: [], appState: {} };
}

/**
 * Save Service API
 */
export const saveService = {
  /**
   * Initialize save service and event listeners.
   * Call this once when the app starts.
   */
  init(): () => void {
    // Listen for save state changes from Rust backend
    const unlistenStateChanged = listen<{ hasUnsavedChanges: boolean; currentFilePath: string | null }>(
      'save-state-changed',
      (event) => {
        currentSaveState.hasUnsavedChanges = event.payload.hasUnsavedChanges;
        currentSaveState.currentFilePath = event.payload.currentFilePath;
        if (!event.payload.hasUnsavedChanges) {
          currentSaveState.lastSavedAt = new Date().toISOString();
        }
        currentSaveState.isSaving = false;
      }
    );

    // Listen for menu-triggered saves
    const unlistenMenuSave = listen('menu-save-triggered', () => {
      this.triggerSave();
    });

    // Listen for shortcut-triggered saves (from global-shortcut plugin)
    const unlistenShortcutSave = listen('shortcut-save-triggered', () => {
      this.triggerSave();
    });

    listeners.push(
      () => unlistenStateChanged.then((fn) => fn()),
      () => unlistenMenuSave.then((fn) => fn()),
      () => unlistenShortcutSave.then((fn) => fn())
    );

    // Return cleanup function
    return () => {
      listeners.forEach((unlisten) => unlisten());
      listeners = [];
    };
  },

  /**
   * Trigger save operation.
   * Shows prompt for path on first save, uses existing path on subsequent saves.
   */
  async triggerSave(): Promise<boolean> {
    console.log('Triggering save');
    if (currentSaveState.isSaving) {
      console.log('Save already in progress, skipping');
      return false;
    }

    currentSaveState.isSaving = true;

    try {
      // Get drawing data
      const drawingData = await getDrawingData();

      // Determine file path - prompt if first save or no path
      let filePath: string | null = null;

      if (!currentSaveState.currentFilePath) {
        // First save - use window prompt
        filePath = prompt('Enter file path to save:', 'untitled.excalidraw');

        if (!filePath) {
          // User cancelled
          currentSaveState.isSaving = false;
          return false;
        }
      } else {
        // Use existing path
        filePath = currentSaveState.currentFilePath;
      }

      const result = await invoke<SaveResult>('save_drawing', {
        jsonData: JSON.stringify(drawingData),
        filePath: filePath,
      });

      if (result.success && result.filePath) {
        currentSaveState.currentFilePath = result.filePath;
        currentSaveState.lastSavedAt = new Date().toISOString();
        currentSaveState.hasUnsavedChanges = false;
        console.log('Drawing saved to:', result.filePath);
        return true;
      } else {
        if (result.error) {
          console.error('Save failed:', result.error);
        }
        currentSaveState.isSaving = false;
        return false;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('Save error:', errorMessage);
      currentSaveState.isSaving = false;
      return false;
    }
  },

  /**
   * Mark drawing as having unsaved changes.
   * Call this when the user modifies the drawing.
   */
  markUnsaved(): void {
    currentSaveState.hasUnsavedChanges = true;
  },

  /**
   * Get current save state.
   */
  getState(): SaveState {
    return { ...currentSaveState };
  },

  /**
   * Check if save is currently in progress.
   */
  isSaving(): boolean {
    return currentSaveState.isSaving;
  },

  /**
   * Check if there are unsaved changes.
   */
  hasUnsavedChanges(): boolean {
    return currentSaveState.hasUnsavedChanges;
  },

  /**
   * Get current file path if saved.
   */
  getCurrentPath(): string | null {
    return currentSaveState.currentFilePath;
  },

  /**
   * Get drawing data from Excalidraw canvas.
   */
  async getDrawingDataFromCanvas(): Promise<unknown> {
    return getDrawingData();
  },

  /**
   * Set drawing data getter function.
   * Called by ExcalidrawCanvas to provide drawing data.
   */
  setDrawingDataGetter(getter: () => Promise<unknown>): void {
    if (typeof window !== 'undefined') {
      (window as any).__excalidrawDrawingDataGetter = getter;
    }
  },

  /**
   * Clean up resources.
   */
  dispose(): void {
    listeners.forEach((unlisten) => unlisten());
    listeners = [];
  },
};
