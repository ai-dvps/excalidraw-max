/**
 * Open Service for Excalidraw Application
 *
 * Provides open functionality:
 * - Trigger open file dialog via
 * - Read menu or keyboard shortcut and parse Excalidraw files
 * - Create new windows with loaded content
 */

import {invoke} from '@tauri-apps/api/core';
import {getCurrentWindow} from '@tauri-apps/api/window';
import {listen} from '@tauri-apps/api/event';
import {open} from '@tauri-apps/plugin-dialog';
import type {InitialData, LoadResult} from '../types/open';
import {stateService} from './stateService';

// Module-level state
let currentOpenState = {
  isLoading: false,
  currentFilePath: null as string | null,
  error: null as string | null,
  progress: null as number | null,
};

// Event listeners cleanup functions
let listeners: (() => void)[] = [];

// After-open callbacks (for change detection)
let afterOpenCallbacks: (() => void)[] = [];

/**
 * Result of window creation from Rust backend.
 */
interface WindowResult {
  success: boolean;
  window_label?: string;
  error?: string;
}

/**
 * Open Service API
 */
export const openService = {
  /**
   * Initialize open service and event listeners.
   * Call this once when the app starts.
   */
  init(): () => void {
    // Listen for menu-triggered opens
    const unlistenMenuOpen = listen('menu-open-triggered', async () => {
      console.log('Menu open triggered');
      // Check if this window is focused before opening
      const {getCurrentWindow} = await import('@tauri-apps/api/window');
      const currentWindow = getCurrentWindow();
      const isFocused = await currentWindow.isFocused();

      if (isFocused) {
        console.log('Window is focused, proceeding with open', currentWindow.label);
        this.triggerOpen();
      } else {
        console.log('Window is not focused, ignoring shortcut', currentWindow.label);
      }
    });

    // Listen for shortcut-triggered opens (from global-shortcut plugin)
    // Only respond if this window is focused
    const unlistenShortcutOpen = listen('shortcut-open-triggered', async () => {
      console.log('Shortcut open triggered');

      // Check if this window is focused before opening
      const {getCurrentWindow} = await import('@tauri-apps/api/window');
      const currentWindow = getCurrentWindow();
      const isFocused = await currentWindow.isFocused();

      if (isFocused) {
        console.log('Window is focused, proceeding with open', currentWindow.label);
        this.triggerOpen();
      } else {
        console.log('Window is not focused, ignoring shortcut', currentWindow.label);
      }
    });

    listeners.push(
      () => unlistenMenuOpen.then((fn) => fn()),
      () => unlistenShortcutOpen.then((fn) => fn())
    );

    // Return cleanup function
    return () => {
      listeners.forEach((unlisten) => unlisten());
      listeners = [];
    };
  },

  /**
   * Trigger open operation.
   * Shows open file dialog, reads file, creates new window.
   */
  async triggerOpen(): Promise<boolean> {
    console.log('Triggering open');
    if (currentOpenState.isLoading) {
      console.log('Open already in progress, skipping');
      return false;
    }

    currentOpenState.isLoading = true;
    currentOpenState.error = null;

    try {
      // Show native open dialog
      const filePath = await this.showOpenDialog();

      if (!filePath) {
        // User cancelled
        currentOpenState.isLoading = false;
        console.log('Open cancelled by user');
        return false;
      }

      // Read and parse file
      const result = await this.readDrawingFile(filePath);

      if (!result.success) {
        // Error reading file
        currentOpenState.error = result.error || 'Unknown error';
        currentOpenState.isLoading = false;
        console.error('Failed to open file:', result.error);
        return false;
      }

      if (result.data) {
        // Success - prepare initial data
        const initialData: InitialData = {
          elements: result.data.elements as any[],
          appState: result.data.appState as any,
          files: result.data.files as Record<string, unknown>,
          filePath: filePath,
        };

        // Check if current window has an existing file open
        const currentWindow = getCurrentWindow();
        const windowLabel = currentWindow.label;
        const currentState = await stateService.getState(windowLabel);
        console.log('[Smart Open] Current window state:', windowLabel, currentState.state, currentState.filePath)

        // If current window is NOT in "created" state (has existing file), load in current window
        // Otherwise, create a new window
        let success: boolean;
        if (currentState.state !== 'created' || currentState.filePath) {
          console.log(`[Smart Open] Current window is not empty, creating new window`);
          success = await this.createNewWindow(initialData);
        } else {
          console.log(`[Smart Open] Current window is empty, loading in current window`);
          success = await this.loadDataIntoCurrentWindow(initialData, windowLabel);
        }

        if (success) {
          currentOpenState.currentFilePath = filePath;
          console.log('File opened successfully:', filePath);
        }

        currentOpenState.isLoading = false;
        return success;
      }

      currentOpenState.isLoading = false;
      return false;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('Open error:', errorMessage);
      currentOpenState.error = errorMessage;
      currentOpenState.isLoading = false;
      return false;
    }
  },

  /**
   * Show the native open file dialog.
   */
  async showOpenDialog(): Promise<string | null> {
    return await open({
      multiple: false,
      directory: false,
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
      title: 'Open Drawing',
    });
  },

  /**
   * Read and parse an Excalidraw file via Rust backend.
   */
  async readDrawingFile(filePath: string): Promise<LoadResult> {
    try {
      const result = await invoke<LoadResult>('read_drawing_file', {
        path: filePath,
      });
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        error: `Failed to read file: ${errorMessage}`,
      };
    }
  },

  /**
   * Create a new Tauri window with the loaded drawing data.
   */
  async createNewWindow(initialData: InitialData): Promise<boolean> {
    try {
      console.log('Creating new window with data...');
      console.log('Elements count:', initialData.elements?.length || 0);
      console.log('AppState:', initialData.appState);
      console.log('Files:', initialData.files ? 'present' : 'empty');
      // Extract file name from path
      const filePath = initialData.filePath;

      const result = await invoke<WindowResult>('create_window_with_data', {
        elements: initialData.elements || [],
        appState: initialData.appState || {},
        files: initialData.files || {},
        filePath,
      });

      if (result.success) {
        console.log('Window created successfully via Rust backend');

        // Update window state to "saved" with the file path
        // Use the returned window_label from the newly created window
        if (filePath && result.window_label) {
          console.log(`Setting saved state for new window: ${result.window_label}`);
          await stateService.setSaved(result.window_label, filePath);
        }

        // Notify after-open callbacks (for change detection)
        afterOpenCallbacks.forEach((callback) => callback());

        return true;
      } else {
        console.error('Failed to create window:', result, result.error);
        currentOpenState.error = result.error || 'Unknown error';
        return false;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('Failed to create window:', errorMessage);
      currentOpenState.error = errorMessage;
      return false;
    }
  },

  /**
   * Load data into the current window instead of creating a new one.
   * Used when current window already has a file open.
   */
  async loadDataIntoCurrentWindow(initialData: InitialData, windowLabel: string): Promise<boolean> {
    try {
      console.log('Loading data into current window:', windowLabel);
      console.log('Elements count:', initialData.elements?.length || 0);

      // Emit event to notify components to load the data
      const { emit } = await import('@tauri-apps/api/event');
      await emit('load-canvas-data', initialData);

      // Update window state to "saved" with the file path
      if (initialData.filePath) {
        console.log(`Setting saved state for window: ${windowLabel}`);
        await stateService.setSaved(windowLabel, initialData.filePath);
      }

      // Notify after-open callbacks (for change detection)
      afterOpenCallbacks.forEach((callback) => callback());

      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('Failed to load data into current window:', errorMessage);
      currentOpenState.error = errorMessage;
      return false;
    }
  },

  /**
   * Get current open state.
   */
  getState() {
    return {...currentOpenState};
  },

  /**
   * Check if open operation is in progress.
   */
  isLoading(): boolean {
    return currentOpenState.isLoading;
  },

  /**
   * Get current error message.
   */
  getError(): string | null {
    return currentOpenState.error;
  },

  /**
   * Register a callback to be called after successful open.
   * Used by change detection to update the saved signature.
   */
  onAfterOpen(callback: () => void): () => void {
    afterOpenCallbacks.push(callback);
    // Return unsubscribe function
    return () => {
      const index = afterOpenCallbacks.indexOf(callback);
      if (index > -1) {
        afterOpenCallbacks.splice(index, 1);
      }
    };
  },

  /**
   * Clean up resources.
   */
  dispose(): void {
    listeners.forEach((unlisten) => unlisten());
    listeners = [];
    afterOpenCallbacks = [];
  },
};
