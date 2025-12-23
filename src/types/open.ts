/**
 * Type definitions for Open File functionality
 */

/**
 * Result of loading an Excalidraw file
 */
export interface LoadResult {
  success: boolean;
  data?: ExcalidrawFile;
  error?: string;
}

/**
 * Data structure representing an Excalidraw drawing file
 */
export interface ExcalidrawFile {
  elements: ExcalidrawElement[];
  appState: AppState;
  files: Record<string, unknown>;
  version?: number;
}

/**
 * Base structure for Excalidraw drawing elements
 */
export interface ExcalidrawElement {
  id: string;
  type: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  strokeColor?: string;
  backgroundColor?: string;
  [key: string]: unknown;
}

/**
 * Application state for the Excalidraw canvas
 */
export interface AppState {
  viewModeEnabled?: boolean;
  zenModeEnabled?: boolean;
  theme?: 'light' | 'dark';
  zoom?: number;
  [key: string]: unknown;
}

/**
 * Initial data prop for Excalidraw component
 */
export interface InitialData {
  elements?: ExcalidrawElement[];
  appState?: Partial<AppState>;
  files?: Record<string, unknown>;
  filePath?: string;
}

/**
 * State for the open file operation
 */
export interface OpenFileState {
  isLoading: boolean;
  currentFilePath: string | null;
  error: string | null;
  progress: number | null;
}
