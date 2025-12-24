import React from 'react';
import { Typography } from 'antd';

const { Title, Paragraph } = Typography;

/**
 * Appearance Settings Component
 *
 * Placeholder component for appearance settings.
 * Future settings can be added here.
 */
const AppearanceSettings: React.FC = () => {
  return (
    <div style={{ padding: '16px 0' }}>
      <Title level={4}>Appearance Settings</Title>
      <Paragraph>
        Appearance settings will be added in a future update.
      </Paragraph>
    </div>
  );
};

export default AppearanceSettings;
