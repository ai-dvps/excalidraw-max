/**
 * Open Service for Excalidraw Application
 *
 * Provides open functionality:
 * - Trigger open file dialog via
 * - Read menu or keyboard shortcut and parse Excalidraw files
 * - Create new windows with loaded content
 */

import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { open } from '@tauri-apps/plugin-dialog';
import type { LoadResult, InitialData } from '../types/open';

// Module-level state
let currentOpenState = {
  isLoading: false,
  currentFilePath: null as string | null,
  error: null as string | null,
  progress: null as number | null,
};

// Event listeners cleanup functions
let listeners: (() => void)[] = [];

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
    const unlistenMenuOpen = listen('menu-open-triggered', () => {
      console.log('Menu open triggered');
      this.triggerOpen();
    });

    // Listen for shortcut-triggered opens (from global-shortcut plugin)
    const unlistenShortcutOpen = listen('shortcut-open-triggered', () => {
      console.log('Shortcut open triggered');
      this.triggerOpen();
    });

    // Listen for load-canvas-data event (when new window is ready)
    const unlistenLoadData = listen<InitialData>('load-canvas-data', (event) => {
      console.log('Load canvas data received:', event.payload);
      // Store the data for the canvas to pick up
      if (typeof window !== 'undefined') {
        (window as any).__excalidrawInitialData = event.payload;
      }
    });

    listeners.push(
      () => unlistenMenuOpen.then((fn) => fn()),
      () => unlistenShortcutOpen.then((fn) => fn()),
      () => unlistenLoadData.then((fn) => fn())
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
        // Success - create new window with loaded data
        const initialData: InitialData = {
          elements: result.data.elements as any[],
          appState: result.data.appState as any,
          files: result.data.files as Record<string, unknown>,
        };

        const success = await this.createNewWindow(initialData);

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
      // Import WebviewWindow dynamically to avoid issues
      const { WebviewWindow } = await import('@tauri-apps/api/webviewWindow');

      // Generate unique window label
      const timestamp = Date.now();
      const windowLabel = `excalidraw-${timestamp}`;

      // Create new window
      const window = new WebviewWindow(windowLabel, {
        url: '/',
        title: 'Excalidraw',
        width: 800,
        height: 600,
      });

      // Wait for window to be created, then send data
      window.once('tauri://created', () => {
        console.log('Window created, sending canvas data');
        window.emit('load-canvas-data', initialData);
      });

      console.log('New window created:', windowLabel);
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('Failed to create window:', errorMessage);
      currentOpenState.error = errorMessage;
      return false;
    }
  },

  /**
   * Get current open state.
   */
  getState() {
    return { ...currentOpenState };
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
   * Clean up resources.
   */
  dispose(): void {
    listeners.forEach((unlisten) => unlisten());
    listeners = [];
  },
};
