import React from 'react';
import { Typography } from 'antd';

const { Title, Paragraph } = Typography;

/**
 * General Settings Component
 *
 * Placeholder component for general settings.
 * Future settings can be added here.
 */
const GeneralSettings: React.FC = () => {
  return (
    <div style={{ padding: '16px 0' }}>
      <Title level={4}>General Settings</Title>
      <Paragraph>
        General settings will be added in a future update.
      </Paragraph>
    </div>
  );
};

export default GeneralSettings;
