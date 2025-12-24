import React from 'react';
import { Menu } from 'antd';
import type { MenuProps } from 'antd';
import useToken from 'antd/es/theme/useToken';
import { SETTINGS_CATEGORIES } from '../../types/settings';

interface SettingsSidebarProps {
  selectedCategory: string;
  onCategorySelect: (categoryId: string) => void;
}

/**
 * Settings Sidebar Component
 *
 * Left navigation panel for settings categories.
 * Uses Ant Design Menu component for category selection.
 */
const SettingsSidebar: React.FC<SettingsSidebarProps> = ({
  selectedCategory,
  onCategorySelect,
}) => {
  const [, token] = useToken();

  const menuItems: MenuProps['items'] = SETTINGS_CATEGORIES.map((category) => ({
    key: category.id,
    label: category.name,
  }));

  return (
    <div
      style={{
        width: 200,
        borderRight: `1px solid ${token.colorBorderSecondary}`,
        height: '100%',
        backgroundColor: token.colorBgContainer,
      }}
    >
      <Menu
        mode="inline"
        selectedKeys={[selectedCategory]}
        items={menuItems}
        onClick={({ key }) => onCategorySelect(key)}
        style={{ border: 'none' }}
      />
    </div>
  );
};

export default SettingsSidebar;
