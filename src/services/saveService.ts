/**
 * Save Service for Excalidraw Application
 *
 * Provides save functionality with smart save behavior:
 * - First save: shows save file dialog
 * - Subsequent saves: use existing path
 */

import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { save } from '@tauri-apps/plugin-dialog';
import type { SaveState, SaveResult } from '../types/save';
import { stateService } from './stateService';

// Module-level state
let saveState: SaveState = {
  isSaving: false,
};

// Event listeners cleanup functions
let listeners: (() => void)[] = [];

// After-save callbacks (for change detection)
let afterSaveCallbacks: (() => void)[] = [];

// After-save callbacks with file path (for window title updates)
type AfterSaveCallback = (filePath: string) => void;
let afterSaveWithPathCallbacks: AfterSaveCallback[] = [];

/**
 * Get current window label for state management.
 */
async function getCurrentWindowLabel(): Promise<string> {
  const { getCurrentWindow } = await import('@tauri-apps/api/window');
  const currentWindow = getCurrentWindow();
  // In Tauri v2, we can get the label from the window object
  // Using type assertion since the API may vary
  return (currentWindow as any).label || 'main';
}

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
  return { elements: [], appState: {}, files: {} };
}

/**
 * Transform drawing data to Excalidraw-compatible format.
 * Converts from internal format to standard Excalidraw JSON format.
 */
function transformToExcalidrawFormat(data: any): any {
  return {
    type: 'excalidraw',
    version: 2,
    source: 'excalimaxdraw',
    elements: data.elements || [],
    appState: data.appState || {},
    files: data.files || {},
  };
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
    // Listen for menu-triggered saves
    const unlistenMenuSave = listen('menu-save-triggered', async () => {
      console.log('Menu save triggered')

      // Check if this window is focused before saving
      const { getCurrentWindow } = await import('@tauri-apps/api/window');
      const currentWindow = getCurrentWindow();
      const isFocused = await currentWindow.isFocused();

      if (isFocused) {
        console.log('Window is focused, proceeding with save', currentWindow.label);
        this.triggerSave(currentWindow.label).then(()=>{
          saveState.isSaving = false
        });
      } else {
        console.log('Window is not focused, ignoring shortcut', currentWindow.label);
      }
    });

    // Listen for shortcut-triggered saves (from global-shortcut plugin)
    // Only respond if this window is focused
    const unlistenShortcutSave = listen('shortcut-save-triggered', async () => {
      console.log('Shortcut save triggered');

      // Check if this window is focused before saving
      const { getCurrentWindow } = await import('@tauri-apps/api/window');
      const currentWindow = getCurrentWindow();
      const isFocused = await currentWindow.isFocused();

      if (isFocused) {
        console.log('Window is focused, proceeding with save', currentWindow.label);
        this.triggerSave(currentWindow.label).then(()=>{
          saveState.isSaving = false
        });
      } else {
        console.log('Window is not focused, ignoring shortcut', currentWindow.label);
      }
    });

    listeners.push(
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
   * Shows save dialog on first save, uses existing path on subsequent saves.
   */
  async triggerSave(windowLabel: string): Promise<boolean> {
    console.log('Triggering save');
    if (saveState.isSaving) {
      console.log('Save already in progress, skipping');
      return false;
    }

    saveState.isSaving = true;

    try {
      // Get drawing data
      const drawingData = await getDrawingData();

      const currentWinState = await stateService.getState(windowLabel);

      // Determine file path - use existing path or show dialog
      let filePath: string | null = null;

      if (!currentWinState.filePath) {
        // First save - show native save dialog
        filePath = await this.showSaveDialog();
      } else {
        // Use existing path
        filePath = currentWinState.filePath;
      }

      if (!filePath) {
        // User cancelled
        saveState.isSaving = false;
        return false;
      }

      const result = await invoke<SaveResult>('save_drawing', {
        jsonData: JSON.stringify(transformToExcalidrawFormat(drawingData)),
        filePath: filePath,
      });

      console.log('Save result:', result)

      if (result.success && result.file_path) {
        console.log('Drawing saved to:', result.file_path);

        // Update window state to "saved"
        const windowLabel = await getCurrentWindowLabel();
        if (result.file_path) {
         await stateService.setSaved(windowLabel, result.file_path);
        }

        // Notify after-save callbacks (for change detection)
        afterSaveCallbacks.forEach((callback) => callback());
        // Notify after-save callbacks with file path (for window title)
        if (result.file_path) {
          const filePath = result.file_path;
          afterSaveWithPathCallbacks.forEach((callback) => callback(filePath));
        }

        return true;
      } else {
        if (result.error) {
          console.error('Save failed:', result.error);
        }
        saveState.isSaving = false;
        return false;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('Save error:', errorMessage);
      saveState.isSaving = false;
      return false;
    }
  },

  /**
   * Show save as dialog and save to the selected path.
   * Always shows the file dialog regardless of current state.
   */
  async triggerSaveAs(): Promise<boolean> {
    console.log('Triggering save as');
    if (saveState.isSaving) {
      console.log('Save already in progress, skipping');
      return false;
    }

    saveState.isSaving = true;

    try {
      // Get drawing data
      const drawingData = await getDrawingData();

      // Always show save dialog for "Save As"
      //TODO shunyun 2025/12/23: pass the current file path as the default path
      const filePath = await this.showSaveDialog();

      if (!filePath) {
        // User cancelled
        saveState.isSaving = false;
        return false;
      }

      const result = await invoke<SaveResult>('save_drawing', {
        jsonData: JSON.stringify(transformToExcalidrawFormat(drawingData)),
        filePath: filePath,
      });

      if (result.success && result.file_path) {
        console.log('Drawing saved to:', result.file_path);

        // Update window state to "saved"
        const windowLabel = await getCurrentWindowLabel();
        if (result.file_path) {
         await stateService.setSaved(windowLabel, result.file_path);
        }

        // Notify after-save callbacks (for change detection)
        afterSaveCallbacks.forEach((callback) => callback());
        // Notify after-save callbacks with file path (for window title)
        if (result.file_path) {
          const filePath = result.file_path;
          afterSaveWithPathCallbacks.forEach((callback) => callback(filePath));
        }

        return true;
      } else {
        if (result.error) {
          console.error('Save failed:', result.error);
        }
        saveState.isSaving = false;
        return false;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('Save error:', errorMessage);
      saveState.isSaving = false;
      return false;
    }
  },

  /**
   * Show the native save file dialog.
   */
  async showSaveDialog(defaultPath?: string): Promise<string | null> {
    return await save({
      filters: [
        {
          name: 'Excalidraw',
          extensions: ['excalidraw', 'json'],
        },
        {
          name: 'JSON',
          extensions: ['json'],
        },
        {
          name: 'All Files',
          extensions: ['*'],
        },
      ],
      defaultPath: defaultPath || 'untitled.excalidraw',
      title: 'Save Drawing',
    });
  },

  /**
   * Get current save state.
   */
  getState(): SaveState {
    return { ...saveState };
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
   * Register a callback to be called after successful save.
   * Used by change detection to update the saved signature.
   */
  onAfterSave(callback: () => void): () => void {
    afterSaveCallbacks.push(callback);
    // Return unsubscribe function
    return () => {
      const index = afterSaveCallbacks.indexOf(callback);
      if (index > -1) {
        afterSaveCallbacks.splice(index, 1);
      }
    };
  },

  /**
   * Register a callback to be called after successful save with file path.
   * Used to update window title with the saved file name.
   */
  onAfterSaveWithPath(callback: (filePath: string) => void): () => void {
    afterSaveWithPathCallbacks.push(callback);
    // Return unsubscribe function
    return () => {
      const index = afterSaveWithPathCallbacks.indexOf(callback);
      if (index > -1) {
        afterSaveWithPathCallbacks.splice(index, 1);
      }
    };
  },

  /**
   * Clean up resources.
   */
  dispose(): void {
    listeners.forEach((unlisten) => unlisten());
    listeners = [];
    afterSaveCallbacks = [];
    afterSaveWithPathCallbacks = [];
  },
};
