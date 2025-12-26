/**
 * User Settings TypeScript Interfaces
 *
 * Defines the shape of user settings data for the excalidraw-max application.
 */

// Placeholder interfaces for future settings categories
export interface GeneralSettings {
  // Reserved for future general application settings
  [key: string]: unknown;
}

export interface AppearanceSettings {
  // Reserved for future appearance preferences
  [key: string]: unknown;
}

export interface ShortcutsSettings {
  // Reserved for future keyboard shortcut configurations
  [key: string]: unknown;
}

/**
 * Editor-specific configuration for the Excalidraw canvas.
 */
export interface EditorSettings {
  /**
   * Default background color for new Excalidraw canvases.
   * Format: Hex color code (e.g., '#ffffff', '#ff0000')
   */
  defaultBackgroundColor: string;
}

/**
 * Top-level settings container for the entire application.
 */
export interface UserSettings {
  general: GeneralSettings;
  appearance: AppearanceSettings;
  shortcuts: ShortcutsSettings;
  editor: EditorSettings;
}

/**
 * Configuration for settings navigation categories.
 */
export interface SettingsCategory {
  id: string;
  name: string;
  icon?: React.ReactNode;
  order: number;
}

/**
 * Predefined categories available in the settings modal.
 */
export const SETTINGS_CATEGORIES: SettingsCategory[] = [
  { id: 'general', name: 'General', order: 1 },
  { id: 'appearance', name: 'Appearance', order: 2 },
  { id: 'shortcuts', name: 'Shortcuts', order: 3 },
  { id: 'editor', name: 'Editor', order: 4 },
];

/**
 * Default settings applied when no stored settings exist.
 */
export const defaultSettings: UserSettings = {
  general: {},
  appearance: {},
  shortcuts: {},
  editor: {
    defaultBackgroundColor: '#ffffff',
  },
};

/**
 * Type guard to check if a value is a valid UserSettings object.
 */
export function isUserSettings(value: unknown): value is UserSettings {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const settings = value as Record<string, unknown>;

  // Check for editor property with valid background color
  const editor = settings.editor;
  if (editor && typeof editor === 'object') {
    const editorSettings = editor as { defaultBackgroundColor?: unknown };
    if (
      typeof editorSettings.defaultBackgroundColor !== 'string' ||
      !isValidHexColor(editorSettings.defaultBackgroundColor)
    ) {
      return false;
    }
  }

  return true;
}

/**
 * Validates a hex color format.
 * Accepts 3-digit (#fff) or 6-digit (#ffffff) hex colors.
 */
export function isValidHexColor(color: string): boolean {
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
}
