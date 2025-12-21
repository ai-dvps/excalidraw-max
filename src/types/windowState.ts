/**
 * Window State Types
 *
 * Defines the window state machine types for tracking save state across windows.
 */

/**
 * Possible states for a window:
 * - created: Window has no associated file path (new or unsaved)
 * - saved: Window has a file path with no unsaved changes
 * - edited: Window has unsaved modifications since last save
 */
export type WindowStateType = 'created' | 'saved' | 'edited';

/**
 * Window state data structure
 */
export interface WindowState {
  /** Current state type */
  state: WindowStateType;
  /** Full path to saved file, null if not saved */
  filePath: string | null;
  /** ISO timestamp of last save, null if never saved */
  lastSavedAt: string | null;
  /** Convenience flag indicating if there are unsaved changes */
  hasUnsavedChanges: boolean;
}

/**
 * Options for close confirmation dialog
 */
export enum CloseAction {
  Save = 'save',
  Discard = 'discard',
  Cancel = 'cancel',
}

/**
 * Result of close confirmation dialog
 */
export interface CloseConfirmationResult {
  action: CloseAction;
}

/**
 * Window state context value for React components
 */
export interface WindowStateContextValue {
  /** Unique identifier for the window */
  windowLabel: string;
  /** Current state object */
  currentState: WindowState;
  /** Get current state */
  getState: () => WindowState;
  /** Transition to saved state (after save or open) */
  setSaved: (filePath: string) => void;
  /** Transition to edited state (user made changes) */
  setEdited: () => void;
  /** Reset to created state (new window) */
  resetCreated: () => void;
}

/**
 * Rust-side WindowState struct (mirrored for FFI)
 */
export interface RustWindowState {
  state: string;
  file_path: string | null;
  last_saved_at: string | null;
  has_unsaved_changes: boolean;
}
