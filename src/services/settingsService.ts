/**
 * Settings Service for Excalidraw Application
 *
 * Provides settings functionality:
 * - Load/save/reset settings via Rust backend
 * - Event listeners for menu and keyboard shortcuts
 * - Auto-save settings on change
 */

import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { UserSettings, defaultSettings, EditorSettings } from '../types/settings';

// Module-level state
let settingsState = {
  isLoading: false,
  isSaving: false,
  error: null as string | null,
};

// Event listeners cleanup functions
let listeners: (() => void)[] = [];

/**
 * Settings Service API
 */
export const settingsService = {
  /**
   * Initialize settings service and event listeners.
   * Call this once when the app starts.
   */
  init(): () => void {
    // Listen for menu-triggered settings
    const unlistenMenuSettings = listen('menu-settings-triggered', async () => {
      console.log('[Settings] Menu settings triggered');
      const { getCurrentWindow } = await import('@tauri-apps/api/window');
      const currentWindow = getCurrentWindow();
      const isFocused = await currentWindow.isFocused();

      if (isFocused) {
        console.log('[Settings] Window is focused, opening settings');
        this.openSettings();
      } else {
        console.log('[Settings] Window is not focused, ignoring shortcut');
      }
    });

    // Listen for shortcut-triggered settings (from global-shortcut plugin)
    const unlistenShortcutSettings = listen('shortcut-settings-triggered', async () => {
      console.log('[Settings] Shortcut settings triggered');
      const { getCurrentWindow } = await import('@tauri-apps/api/window');
      const currentWindow = getCurrentWindow();
      const isFocused = await currentWindow.isFocused();

      if (isFocused) {
        console.log('[Settings] Window is focused, opening settings');
        this.openSettings();
      } else {
        console.log('[Settings] Window is not focused, ignoring shortcut');
      }
    });

    listeners.push(
      () => unlistenMenuSettings.then((fn) => fn()),
      () => unlistenShortcutSettings.then((fn) => fn())
    );

    // Return cleanup function
    return () => {
      listeners.forEach((unlisten) => unlisten());
      listeners = [];
    };
  },

  /**
   * Open the settings window via Rust command.
   */
  async openSettings(): Promise<void> {
    try {
      await invoke('open_settings_window');
    } catch (error) {
      console.error('[Settings] Failed to open settings window:', error);
    }
  },

  /**
   * Load user settings from the Tauri backend.
   * Returns default settings if none exist or on error.
   */
  async loadSettings(): Promise<UserSettings> {
    settingsState.isLoading = true;
    settingsState.error = null;

    try {
      const result = await invoke<LoadSettingsResponse>('load_settings');

      const settings: UserSettings = {
        general: result.general || {},
        appearance: result.appearance || {},
        shortcuts: result.shortcuts || {},
        editor: {
          defaultBackgroundColor: result.editor?.defaultBackgroundColor || defaultSettings.editor.defaultBackgroundColor,
        },
      };

      console.log('[Settings] Loaded settings:', settings);
      return settings;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('[Settings] Failed to load settings:', errorMessage);
      settingsState.error = errorMessage;
      return defaultSettings;
    } finally {
      settingsState.isLoading = false;
    }
  },

  /**
   * Save user settings to the Tauri backend.
   * Returns true on success, false on error.
   */
  async saveSettings(settings: UserSettings): Promise<boolean> {
    settingsState.isSaving = true;
    settingsState.error = null;

    try {
      await invoke<SaveSettingsResponse>('save_settings', {
        settings: {
          general: settings.general,
          appearance: settings.appearance,
          shortcuts: settings.shortcuts,
          editor: {
            defaultBackgroundColor: settings.editor.defaultBackgroundColor,
          },
        },
      });

      console.log('[Settings] Saved settings:', settings);
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('[Settings] Failed to save settings:', errorMessage);
      settingsState.error = errorMessage;
      return false;
    } finally {
      settingsState.isSaving = false;
    }
  },

  /**
   * Reset settings to default values.
   * Returns the default settings after reset.
   */
  async resetSettings(): Promise<UserSettings> {
    settingsState.isSaving = true;
    settingsState.error = null;

    try {
      const result = await invoke<ResetSettingsResponse>('reset_settings');

      const settings: UserSettings = {
        general: result.general || {},
        appearance: result.appearance || {},
        shortcuts: result.shortcuts || {},
        editor: {
          defaultBackgroundColor: result.editor?.defaultBackgroundColor || defaultSettings.editor.defaultBackgroundColor,
        },
      };

      console.log('[Settings] Reset settings to defaults:', settings);
      return settings;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('[Settings] Failed to reset settings:', errorMessage);
      settingsState.error = errorMessage;
      return defaultSettings;
    } finally {
      settingsState.isSaving = false;
    }
  },

  /**
   * Update a single editor setting.
   * Convenience function for updating just one setting value.
   */
  async updateEditorSetting(
    key: keyof EditorSettings,
    value: string
  ): Promise<boolean> {
    if (key === 'defaultBackgroundColor') {
      // Validate hex color format
      const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
      if (!hexRegex.test(value)) {
        console.error('[Settings] Invalid hex color format:', value);
        return false;
      }

      const currentSettings = await this.loadSettings();
      currentSettings.editor.defaultBackgroundColor = value;
      return await this.saveSettings(currentSettings);
    }

    return false;
  },

  /**
   * Get current settings state.
   */
  getState() {
    return { ...settingsState };
  },

  /**
   * Check if settings are currently being loaded.
   */
  isLoading(): boolean {
    return settingsState.isLoading;
  },

  /**
   * Check if settings are currently being saved.
   */
  isSaving(): boolean {
    return settingsState.isSaving;
  },

  /**
   * Get current error message.
   */
  getError(): string | null {
    return settingsState.error;
  },

  /**
   * Clean up resources.
   */
  dispose(): void {
    listeners.forEach((unlisten) => unlisten());
    listeners = [];
  },
};

// Rust command response types
interface LoadSettingsResponse {
  general: Record<string, unknown> | null;
  appearance: Record<string, unknown> | null;
  shortcuts: Record<string, unknown> | null;
  editor: {
    defaultBackgroundColor: string;
  };
}

interface SaveSettingsResponse {
  success: boolean;
}

interface ResetSettingsResponse {
  general: Record<string, unknown> | null;
  appearance: Record<string, unknown> | null;
  shortcuts: Record<string, unknown> | null;
  editor: {
    defaultBackgroundColor: string;
  };
}
