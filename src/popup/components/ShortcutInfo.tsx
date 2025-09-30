import { Flex, Typography } from 'antd';
import { EditOutlined } from '@ant-design/icons';
import type { ShortcutInfoProps } from '../../types/popup/components.js';
import { SHORTCUTS_PAGE } from '../../scripts/constants.js';
import { useExtensionSettings } from '../hooks/useExtensionSettings.js';

const { Text } = Typography;

const iconStyle: React.CSSProperties = {
  color: 'var(--bp-gray)',
  fontSize: '1.1rem',
  cursor: 'pointer',
};

/**
 * A component that displays the keyboard shortcut for a given command.
 *
 * It retrieves the shortcut from extension settings and provides a link to
 * the Chrome extensions shortcuts page for editing.
 */
export default function ShortcutInfo({
  command,
}: ShortcutInfoProps): React.ReactElement {
  const { shortcuts } = useExtensionSettings();

  /**
   * Opens the Chrome extensions shortcuts page in a new tab.
   * Uses the Chrome Tabs API if available, otherwise falls back to window.open.
   */
  const openShortcutsPage = () => {
    if (chrome?.tabs) {
      chrome.tabs.create({ url: SHORTCUTS_PAGE });
    } else {
      window.open(SHORTCUTS_PAGE, '_blank');
    }
  };

  return (
    <Flex justify='space-between' align='center' style={{ marginTop: 4 }}>
      <Text type='secondary'>Keyboard Shortcut:</Text>

      <Flex align='center' gap={8}>
        <Text type='secondary'>{shortcuts[command] || 'None'}</Text>
        <EditOutlined style={iconStyle} onClick={openShortcutsPage} />
      </Flex>
    </Flex>
  );
}
