import React from 'react';
import { Typography } from 'antd';

const { Title, Paragraph } = Typography;

/**
 * Shortcuts Settings Component
 *
 * Placeholder component for keyboard shortcut customization.
 * Future settings can be added here.
 */
const ShortcutsSettings: React.FC = () => {
  return (
    <div style={{ padding: '16px 0' }}>
      <Title level={4}>Shortcuts Settings</Title>
      <Paragraph>
        Keyboard shortcut customization will be added in a future update.
      </Paragraph>
    </div>
  );
};

export default ShortcutsSettings;
