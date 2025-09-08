import { useEffect, useState } from 'react';
import { Flex, Typography } from 'antd';
import { EditOutlined } from '@ant-design/icons';
import { SHORTCUTS_PAGE } from '../../scripts/constants.js';

const { Text } = Typography;

const iconStyle = {
  color: 'var(--bp-gray)',
  fontSize: '1.1rem',
  cursor: 'pointer',
};
const NO_SHORTCUT_SET = 'No shortcut set.';

export default function ShortcutInfo({ command }) {
  const [shortcut, setShortcut] = useState(NO_SHORTCUT_SET);

  useEffect(() => {
    if (window.chrome && chrome.commands) {
      chrome.commands.getAll(commands => {
        const toggleCmd = commands.find(cmd => cmd.name === command);
        console.log('toggleCmd', toggleCmd);
        setShortcut(
          toggleCmd && toggleCmd.shortcut ? toggleCmd.shortcut : NO_SHORTCUT_SET
        );
      });
    }
  }, []);

  /**
   * Opens the Chrome extensions shortcuts page in a new tab.
   * Uses the Chrome Tabs API if available, otherwise falls back to window.open.
   */
  const openShortcutsPage = () => {
    if (window.chrome && chrome.tabs) {
      chrome.tabs.create({ url: SHORTCUTS_PAGE });
    } else {
      window.open(SHORTCUTS_PAGE, '_blank');
    }
  };

  return (
    <Flex justify='space-between' align='center' style={{ marginTop: 4 }}>
      <Text type='secondary'>Keyboard Shortcut:</Text>

      <Flex align='center' gap={8}>
        <Text type='secondary'>{shortcut}</Text>
        <EditOutlined style={iconStyle} onClick={openShortcutsPage} />
      </Flex>
    </Flex>
  );
}
