import React, { useState, useEffect, useCallback } from 'react';
import { Layout } from 'antd';
import { listen } from '@tauri-apps/api/event';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { useSettings } from '../../hooks/useSettings';
import { UserSettings } from '../../types/settings';
import SettingsSidebar from './SettingsSidebar';
import SettingsContent from './SettingsContent';

interface SettingsProps {
  // Props passed from Tauri when opened as a separate window
}

/**
 * Settings Window Component
 *
 * Main settings page for the settings window (rendered in a separate Tauri WebviewWindow).
 * Two-column layout: categories on left, settings on right.
 * Settings are auto-saved on change.
 *
 * Features:
 * - Keyboard shortcut support (Escape to close)
 * - Category navigation
 * - Auto-save settings on change
 */
const Settings: React.FC<SettingsProps> = () => {
  const { settings: loadedSettings, isLoading, save, reload } = useSettings();
  const [selectedCategory, setSelectedCategory] = useState('general');
  // Local state for edited settings - initialized from loaded settings
  const [editedSettings, setEditedSettings] = useState<UserSettings | null>(null);

  // Initialize edited settings when loadedSettings changes
  useEffect(() => {
    console.log('[Settings] Loaded settings changed:', loadedSettings)
    if (loadedSettings && editedSettings === null) {
      setEditedSettings(loadedSettings);
    }
  }, [loadedSettings]);

  // Reload settings when window becomes visible (handles show/hide scenario)
  useEffect(() => {
    const reloadSettings = async () => {
      console.log('[Settings] Reloading settings...');
      await reload();
      setEditedSettings(null); // Will be reinitialized from new loadedSettings
    };

    // Listen for settings-reload event from Rust
    const unlistenEvent = listen('settings-reload', reloadSettings);

    // Also use document visibility to reload when window becomes visible
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        reloadSettings();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      unlistenEvent.then((fn) => fn());
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [reload]);

  // Update editor setting and auto-save
  const updateEditorSetting = useCallback((color: string) => {
    console.log('[Settings] Updating editor setting:', color);
    if (!editedSettings) return;
    const newSettings = {
      ...editedSettings,
      editor: { ...editedSettings.editor, defaultBackgroundColor: color },
    };
    setEditedSettings(newSettings);
    // Auto-save immediately
    save(newSettings);
  }, [editedSettings, save]);

  // Handle Escape key to close window
  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        const appWindow = getCurrentWindow();
        await appWindow.close();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Pass the current editor color to SettingsContent
  const currentEditorColor = editedSettings?.editor.defaultBackgroundColor || '#ffffff';
  console.log('[Settings] Current editor color:', currentEditorColor)
  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div
        style={{
          padding: '12px 24px',
          borderBottom: '1px solid #f0f0f0',
          backgroundColor: '#fff',
        }}
      >
        <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Settings</h2>
      </div>

      {/* Main content with two-column layout */}
      <Layout
        style={{
          flex: 1,
          background: '#fff',
          display: 'flex',
          flexDirection: 'row',
        }}
      >
        <SettingsSidebar
          selectedCategory={selectedCategory}
          onCategorySelect={setSelectedCategory}
        />
        <div
          style={{
            flex: 1,
            borderLeft: '1px solid #f0f0f0',
            overflow: 'hidden',
          }}
        >
          <SettingsContent
            categoryId={selectedCategory}
            isLoading={isLoading}
            currentEditorColor={currentEditorColor}
            onEditorColorChange={updateEditorSetting}
          />
        </div>
      </Layout>
    </div>
  );
};

export default Settings;
