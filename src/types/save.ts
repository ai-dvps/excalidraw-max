/**
 * Type definitions for Save Menu Feature
 */

/**
 * Tracks the current save status of the drawing.
 */
export interface SaveState {
  /** True if drawing has modifications since last save */
  hasUnsavedChanges: boolean;
  /** Absolute path to saved file; null if never saved */
  currentFilePath: string | null;
  /** ISO 8601 timestamp of last successful save */
  lastSavedAt: string | null;
  /** True if save operation is in progress */
  isSaving: boolean;
}

/**
 * Native menu item configuration.
 */
export interface SaveMenuItem {
  /** Unique identifier for menu item */
  id: 'save';
  /** Display text shown in menu */
  text: 'Save';
  /** Keyboard shortcut hint */
  accelerator: 'CmdOrControl+S';
  /** Whether the menu item is enabled */
  enabled: boolean;
}

/**
 * Output of save operation.
 */
export interface SaveResult {
  /** True if save completed successfully */
  success: boolean;
  /** Path where file was saved (null if cancelled) - snake_case to match Rust struct */
  file_path: string | null;
  /** Error message if success is false */
  error: string | null;
}

/**
 * Request payload for save_drawing command.
 */
export interface SaveDrawingRequest {
  /** JSON serialization of the drawing data */
  jsonData: string;
  /** If true, always show file dialog even if path is known */
  forceDialog?: boolean;
}

/**
 * Save state change event payload.
 */
export interface SaveStateChangedEvent {
  /** Whether there are unsaved changes */
  hasUnsavedChanges: boolean;
  /** Current file path (null if never saved) */
  currentFilePath: string | null;
}
