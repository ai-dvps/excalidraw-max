import React from 'react';
import { Spin } from 'antd';
import GeneralSettings from './GeneralSettings';
import AppearanceSettings from './AppearanceSettings';
import ShortcutsSettings from './ShortcutsSettings';
import EditorSettings from './EditorSettings';

interface SettingsContentProps {
  categoryId: string;
  isLoading: boolean;
  currentEditorColor?: string;
  onEditorColorChange?: (color: string) => void;
}

/**
 * Settings Content Component
 *
 * Renders the appropriate settings panel based on the selected category.
 */
const SettingsContent: React.FC<SettingsContentProps> = ({
  categoryId,
  isLoading,
  currentEditorColor,
  onEditorColorChange,
}) => {
  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100%',
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  const renderContent = () => {
    switch (categoryId) {
      case 'general':
        return <GeneralSettings />;
      case 'appearance':
        return <AppearanceSettings />;
      case 'shortcuts':
        return <ShortcutsSettings />;
      case 'editor':
        return (
          <EditorSettings
            currentColor={currentEditorColor}
            onColorChange={onEditorColorChange}
          />
        );
      default:
        return <GeneralSettings />;
    }
  };

  return (
    <div
      style={{
        padding: '24px',
        height: '100%',
        overflow: 'auto',
      }}
    >
      {renderContent()}
    </div>
  );
};

export default SettingsContent;
