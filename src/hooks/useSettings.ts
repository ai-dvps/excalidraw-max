/**
 * useSettings Hook
 *
 * React hook for managing user settings state and operations.
 */

import { useState, useEffect, useCallback } from 'react';
import { UserSettings, defaultSettings } from '../types/settings';
import { settingsService } from '../services/settingsService';

/**
 * Return type for the useSettings hook.
 */
export interface UseSettingsReturn {
  /** Current user settings */
  settings: UserSettings;
  /** Whether settings are currently being loaded */
  isLoading: boolean;
  /** Whether settings are currently being saved */
  isSaving: boolean;
  /** Error message if an operation failed, null if no error */
  error: string | null;
  /** Save the given settings */
  save: (newSettings: UserSettings) => Promise<void>;
  /** Reset settings to defaults */
  reset: () => Promise<void>;
  /** Update a single setting value */
  updateSetting: <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => Promise<void>;
  /** Reload settings from backend */
  reload: () => Promise<void>;
}

/**
 * Hook for accessing and managing user settings.
 *
 * @example
 * const { settings, save, reset } = useSettings();
 *
 * // Load settings on mount (automatic)
 * // Access current settings
 * console.log(settings.editor.defaultBackgroundColor);
 *
 * // Save settings
 * await save({ ...settings, editor: { ...settings.editor, defaultBackgroundColor: '#ff0000' } });
 *
 * // Reset to defaults
 * await reset();
 */
export function useSettings(): UseSettingsReturn {
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load settings on mount
  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const loadedSettings = await settingsService.loadSettings();
        setSettings(loadedSettings);
      } catch (err) {
        console.error('Error loading settings:', err);
        setError('Failed to load settings');
        // Keep default settings on error
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, []);

  // Save settings
  const save = useCallback(async (newSettings: UserSettings) => {
    try {
      setIsSaving(true);
      setError(null);
      const success = await settingsService.saveSettings(newSettings);
      if (!success) {
        throw new Error('Save operation returned false');
      }
      setSettings(newSettings);
    } catch (err) {
      console.error('Error saving settings:', err);
      setError('Failed to save settings');
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, []);

  // Reset settings
  const reset = useCallback(async () => {
    try {
      setIsSaving(true);
      setError(null);
      const defaultSettingsData = await settingsService.resetSettings();
      setSettings(defaultSettingsData);
    } catch (err) {
      console.error('Error resetting settings:', err);
      setError('Failed to reset settings');
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, []);

  // Update a single setting
  const updateSetting = useCallback(
    async <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
      const newSettings = { ...settings, [key]: value };
      await save(newSettings as UserSettings);
    },
    [settings, save]
  );

  // Reload settings from backend
  const reload = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const loadedSettings = await settingsService.loadSettings();
      setSettings(loadedSettings);
    } catch (err) {
      console.error('Error reloading settings:', err);
      setError('Failed to reload settings');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    settings,
    isLoading,
    isSaving,
    error,
    save,
    reset,
    updateSetting,
    reload,
  };
}

/**
 * Hook for accessing only editor settings with convenience methods.
 * Note: This hook only manages local state. Use save() from useSettings to persist.
 */
export function useEditorSettings() {
  const { settings, isSaving } = useSettings();
  const [localColor, setLocalColor] = useState(settings.editor.defaultBackgroundColor);

  // Sync local state when settings change (e.g., after reload)
  useEffect(() => {
    setLocalColor(settings.editor.defaultBackgroundColor);
  }, [settings.editor.defaultBackgroundColor]);

  const setDefaultBackgroundColor = useCallback((color: string) => {
    setLocalColor(color);
  }, []);

  return {
    defaultBackgroundColor: localColor,
    setDefaultBackgroundColor,
    isSaving,
  };
}
