/**
 * useWindowState Hook
 *
 * React hook for managing window state in ExcalidrawCanvas.
 * Provides state management and window title updates based on state.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import type { WindowState } from '../types/windowState';

// Module-level state store (per window)
const windowStates: Map<string, WindowState> = new Map();
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
 * Update window state and notify listeners
 */
function updateState(label: string, updates: Partial<WindowState>): WindowState {
  const current = windowStates.get(label) || getInitialState();
  const newState = { ...current, ...updates };
  windowStates.set(label, newState);

  // Notify listeners
  const listeners = stateListeners.get(label);
  if (listeners) {
    listeners.forEach((callback) => callback(newState));
  }

  return newState;
}

/**
 * Generate window title based on state
 */
export function generateWindowTitle(state: WindowState, defaultTitle: string = 'Untitled'): string {
  if (state.state === 'created' || !state.filePath) {
    return defaultTitle;
  }

  // Extract filename from path
  const filename = state.filePath.split('/').pop() || defaultTitle;

  if (state.state === 'edited') {
    return `[edited] ${filename}`;
  }

  return `[saved] ${filename}`;
}

/**
 * Update window title
 */
async function setWindowTitle(title: string): Promise<void> {
  const win = getCurrentWindow();
  await win.setTitle(title);
}

interface UseWindowStateOptions {
  /** Window label for state isolation */
  windowLabel?: string;
  /** Default title for created state */
  defaultTitle?: string;
  /** Callback when state changes */
  onStateChange?: (state: WindowState) => void;
}

interface UseWindowStateReturn {
  /** Current window state */
  state: WindowState;
  /** Get current state synchronously */
  getState: () => WindowState;
  /** Transition to saved state */
  setSaved: (filePath: string) => void;
  /** Transition to edited state */
  setEdited: () => void;
  /** Reset to created state */
  resetCreated: () => void;
  /** Update window title based on current state */
  updateWindowTitle: () => Promise<void>;
}

/**
 * Hook for managing window state
 *
 * Usage:
 * const { state, setSaved, setEdited, resetCreated } = useWindowState({ windowLabel: 'main' });
 */
export function useWindowState(options: UseWindowStateOptions = {}): UseWindowStateReturn {
  const { windowLabel = 'main', defaultTitle = 'Untitled', onStateChange } = options;

  const [state, setState] = useState<WindowState>(() => {
    const existing = windowStates.get(windowLabel);
    if (existing) {
      return existing;
    }
    const initial = getInitialState();
    windowStates.set(windowLabel, initial);
    return initial;
  });

  // Track if we've initialized the state for this window
  const initialized = useRef(false);

  // Set up listener for state changes
  useEffect(() => {
    if (!stateListeners.has(windowLabel)) {
      stateListeners.set(windowLabel, new Set());
    }

    const listeners = stateListeners.get(windowLabel)!;
    const handleStateChange = (newState: WindowState) => {
      setState(newState);
      onStateChange?.(newState);
    };

    listeners.add(handleStateChange);

    return () => {
      listeners.delete(handleStateChange);
      if (listeners.size === 0) {
        stateListeners.delete(windowLabel);
      }
    };
  }, [windowLabel, onStateChange]);

  // Initialize state on mount and update window title
  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;

      // Update window title on mount
      const title = generateWindowTitle(state, defaultTitle);
      setWindowTitle(title);
    }
  }, []);

  /**
   * Get current state synchronously
   */
  const getState = useCallback(() => {
    return windowStates.get(windowLabel) || getInitialState();
  }, [windowLabel]);

  /**
   * Transition to saved state (after save or open)
   */
  const setSaved = useCallback(
    (filePath: string) => {
      const newState = updateState(windowLabel, {
        state: 'saved',
        filePath,
        lastSavedAt: new Date().toISOString(),
        hasUnsavedChanges: false,
      });

      // Update window title
      const title = generateWindowTitle(newState, defaultTitle);
      setWindowTitle(title);
    },
    [windowLabel, defaultTitle]
  );

  /**
   * Transition to edited state (user made changes)
   */
  const setEdited = useCallback(() => {
    const current = windowStates.get(windowLabel);
    if (current && current.state !== 'edited') {
      const newState = updateState(windowLabel, {
        state: 'edited',
        hasUnsavedChanges: true,
      });

      // Update window title
      const title = generateWindowTitle(newState, defaultTitle);
      setWindowTitle(title);
    } else if (current) {
      // Already in edited state, just ensure flag is set
      updateState(windowLabel, { hasUnsavedChanges: true });
    }
  }, [windowLabel, defaultTitle]);

  /**
   * Reset to created state (new window)
   */
  const resetCreated = useCallback(() => {
    const newState = updateState(windowLabel, {
      state: 'created',
      filePath: null,
      lastSavedAt: null,
      hasUnsavedChanges: false,
    });

    // Update window title
    const title = generateWindowTitle(newState, defaultTitle);
    setWindowTitle(title);
  }, [windowLabel, defaultTitle]);

  /**
   * Update window title based on current state
   */
  const updateWindowTitle = useCallback(async () => {
    const currentState = windowStates.get(windowLabel) || getInitialState();
    const title = generateWindowTitle(currentState, defaultTitle);
    await setWindowTitle(title);
  }, [windowLabel, defaultTitle]);

  return {
    state,
    getState,
    setSaved,
    setEdited,
    resetCreated,
    updateWindowTitle,
  };
}

export default useWindowState;
