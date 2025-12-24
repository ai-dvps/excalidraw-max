import React from 'react';
import { Typography, ColorPicker } from 'antd';
import type { Color } from 'antd/es/color-picker';

const { Title, Paragraph } = Typography;

interface EditorSettingsProps {
  currentColor?: string;
  onColorChange?: (color: string) => void;
}

/**
 * Editor Settings Component
 *
 * Editor-specific settings for the Excalidraw canvas.
 * Currently supports configuring the default background color.
 */
const EditorSettings: React.FC<EditorSettingsProps> = ({
  currentColor = '#ffffff',
  onColorChange,
}) => {
  return (
    <div style={{ padding: '16px 0' }}>
      <Title level={4}>Editor Settings</Title>
      <Paragraph>
        Configure the default appearance for new Excalidraw canvases.
      </Paragraph>

      <div style={{ marginTop: 24 }}>
        <Paragraph strong>Default Canvas Background</Paragraph>
        <ColorPicker
          value={currentColor}
          onChange={(color: Color) => {
            const hex = color.toHexString();
            onColorChange?.(hex);
          }}
        />
        <Paragraph type="secondary" style={{ marginTop: 8 }}>
          Selected color: {currentColor}
        </Paragraph>
      </div>
    </div>
  );
};

export default EditorSettings;
