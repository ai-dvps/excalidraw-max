/**
 * State Service for Window State Machine
 *
 * Frontend service for managing window state across the application.
 * Provides state management API that integrates with the Rust backend.
 */

import { invoke } from '@tauri-apps/api/core';
import type { WindowState } from '../types/windowState';

// Module-level state cache (frontend mirror of backend state)
const stateCache: Map<string, WindowState> = new Map();
const stateListeners: Map<string, Set<(state: WindowState) => void>> = new Map();

/**
 * Get the initial state for a new window
 */
function getInitialState(): WindowState {
  return {
    state: 'created',
    filePath: null,
    lastSavedAt: null,
    hasUnsavedChanges: false,
  };
}

/**
 * State Service API
 */
export const stateService = {
  /**
   * Initialize state service.
   * Call this when the app starts.
   */
  init(): () => void {
    // Set up listeners for state changes from Rust backend
    const unlistenStateChanged = listen<{ windowLabel: string; state: WindowState }>(
      'window-state-changed',
      (event) => {
        const { windowLabel, state } = event.payload;
        stateCache.set(windowLabel, state);

        // Notify listeners
        const listeners = stateListeners.get(windowLabel);
        if (listeners) {
          listeners.forEach((callback) => callback(state));
        }
      }
    );

    // Return cleanup function
    return () => {
      unlistenStateChanged.then((fn) => fn());
    };
  },

  /**
   * Get current state for a window (from cache or Rust backend)
   */
  async getState(windowLabel: string): Promise<WindowState> {
    // Check cache first
    if (stateCache.has(windowLabel)) {
      return stateCache.get(windowLabel)!;
    }

    // Fetch from Rust backend
    try {
      const state = await invoke<WindowState>('get_window_state', { windowLabel });
      stateCache.set(windowLabel, state);
      return state;
    } catch (error) {
      console.error('Failed to get window state:', error);
      return getInitialState();
    }
  },

  /**
   * Transition to saved state (after save or open)
   */
  async setSaved(windowLabel: string, filePath: string): Promise<void> {
    const newState: WindowState = {
      state: 'saved',
      filePath,
      lastSavedAt: new Date().toISOString(),
      hasUnsavedChanges: false,
    };

    // Update cache
    stateCache.set(windowLabel, newState);

    // Notify listeners
    const listeners = stateListeners.get(windowLabel);
    if (listeners) {
      listeners.forEach((callback) => callback(newState));
    }

    // Update Rust backend
    try {
      await invoke('mark_window_saved', { windowLabel, filePath });
    } catch (error) {
      console.error('Failed to mark window as saved:', error);
    }
  },

  /**
   * Transition to edited state (user made changes)
   */
  async setEdited(windowLabel: string): Promise<void> {
    const current = stateCache.get(windowLabel) || getInitialState();

    // Only transition if not already in edited state
    if (current.state === 'edited') {
      // Just update the flag, don't trigger title change
      stateCache.set(windowLabel, { ...current, hasUnsavedChanges: true });
      return;
    }

    const newState: WindowState = {
      state: 'edited',
      filePath: current.filePath,
      lastSavedAt: current.lastSavedAt,
      hasUnsavedChanges: true,
    };

    // Update cache
    stateCache.set(windowLabel, newState);

    // Notify listeners
    const listeners = stateListeners.get(windowLabel);
    if (listeners) {
      listeners.forEach((callback) => callback(newState));
    }

    // Update Rust backend
    try {
      await invoke('mark_window_edited', { windowLabel });
    } catch (error) {
      console.error('Failed to mark window as edited:', error);
    }
  },

  /**
   * Reset to created state (new window)
   */
  async resetCreated(windowLabel: string): Promise<void> {
    const newState = getInitialState();

    // Update cache
    stateCache.set(windowLabel, newState);

    // Notify listeners
    const listeners = stateListeners.get(windowLabel);
    if (listeners) {
      listeners.forEach((callback) => callback(newState));
    }

    // Update Rust backend
    try {
      await invoke('reset_window_created', { windowLabel });
    } catch (error) {
      console.error('Failed to reset window state:', error);
    }
  },

  /**
   * Subscribe to state changes for a window
   */
  onStateChange(windowLabel: string, callback: (state: WindowState) => void): () => void {
    if (!stateListeners.has(windowLabel)) {
      stateListeners.set(windowLabel, new Set());
    }

    const listeners = stateListeners.get(windowLabel)!;
    listeners.add(callback);

    // Return unsubscribe function
    return () => {
      listeners.delete(callback);
      if (listeners.size === 0) {
        stateListeners.delete(windowLabel);
      }
    };
  },

  /**
   * Check if window has unsaved changes
   */
  async hasUnsavedChanges(windowLabel: string): Promise<boolean> {
    const state = await this.getState(windowLabel);
    return state.hasUnsavedChanges;
  },

  /**
   * Get file path for window
   */
  async getFilePath(windowLabel: string): Promise<string | null> {
    const state = await this.getState(windowLabel);
    return state.filePath;
  },

  /**
   * Clean up resources
   */
  dispose(): void {
    stateListeners.forEach((listeners) => {
      listeners.clear();
    });
    stateListeners.clear();
    stateCache.clear();
  },
};

// Need to import listen for the init function
import { listen } from '@tauri-apps/api/event';

export default stateService;
