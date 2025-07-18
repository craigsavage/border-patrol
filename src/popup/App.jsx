import { useState, useEffect } from 'react';
import { Space, Divider } from 'antd';
import {
  getActiveTab,
  isRestrictedUrl,
  hasPermission,
} from '../scripts/helpers.js';
import Logger from '../scripts/utils/logger.js';

// Components
import Header from './components/Header.jsx';
import RestrictedMessage from './components/RestrictedMessage';
import FeatureToggle from './components/FeatureToggle';
import BorderSettings from './components/BorderSettings';
import ScreenshotSection from './components/ScreenshotSection';
import Footer from './components/Footer';

export default function App() {
  const [isRestricted, setIsRestricted] = useState(false);
  const [borderMode, setBorderMode] = useState(false);
  const [inspectorMode, setInspectorMode] = useState(false);
  const [borderSize, setBorderSize] = useState(1);
  const [borderStyle, setBorderStyle] = useState('solid');
  const [hasDownloadPermission, setHasDownloadPermission] = useState(false);
  const [tabId, setTabId] = useState(null);

  const checkDownloadPermission = async () => {
    try {
      const granted = await hasPermission('downloads');
      setHasDownloadPermission(granted);
      Logger.info(`Download permission status: ${granted}`);
      return granted;
    } catch (error) {
      Logger.error('Error checking download permission:', error);
      setHasDownloadPermission(false);
      return false;
    }
  };

  const requestDownloadPermission = async () => {
    try {
      const granted = await chrome.permissions.request({
        permissions: ['downloads'],
      });
      setHasDownloadPermission(granted);
      if (granted) {
        // You might want a better notification system with Ant Design 'message' component
        // message.success('Download permission granted!');
      } else {
        // message.error('Download permission denied');
      }
      return granted;
    } catch (error) {
      Logger.error('Error requesting download permission:', error);
      // message.error('Failed to request download permission');
      return false;
    }
  };

  const handleToggleBorderMode = checked => {
    setBorderMode(checked);
    chrome.runtime.sendMessage({
      action: 'TOGGLE_BORDER_MODE',
      isEnabled: checked,
      tabId: tabId,
    });
  };

  const handleToggleInspectorMode = checked => {
    setInspectorMode(checked);
    chrome.runtime.sendMessage({
      action: 'TOGGLE_INSPECTOR_MODE',
      isEnabled: checked,
      tabId: tabId,
    });
  };

  const handleUpdateBorderSettings = (size, style) => {
    setBorderSize(size);
    setBorderStyle(style);
    chrome.runtime.sendMessage({
      action: 'UPDATE_BORDER_SETTINGS',
      borderSize: size,
      borderStyle: style,
    });
  };

  const handleCaptureScreenshot = async () => {
    try {
      const success = await chrome.runtime.sendMessage({
        action: 'CAPTURE_SCREENSHOT',
      });
      Logger.info('Screenshot capture response:', success);
      return success;
    } catch (error) {
      Logger.error('Error capturing screenshot:', error);
      return false;
    }
  };

  // --- Initial Data Fetching (useEffect) ---
  useEffect(() => {
    const initializeStates = async () => {
      Logger.info('Initializing popup state...');
      try {
        const tab = await getActiveTab();

        if (!tab?.id || !tab?.url || isRestrictedUrl(tab.url)) {
          setIsRestricted(true);
          Logger.info('Restricted page detected. Hiding form controls.');
          return;
        }

        setIsRestricted(false);
        setTabId(tab.id); // Store tabId

        const tabIdString = tab.id.toString();
        const data = await chrome.storage.local.get([
          tabIdString,
          'borderSize',
          'borderStyle',
        ]);

        setBorderMode(data[tabIdString]?.borderMode ?? false);
        setInspectorMode(data[tabIdString]?.inspectorMode ?? false);
        setBorderSize(data.borderSize ?? 1);
        setBorderStyle(data.borderStyle ?? 'solid');

        // Only check download permissions if not restricted
        await checkDownloadPermission();
      } catch (error) {
        Logger.error('Error during initialization:', error);
        setIsRestricted(true); // Show restricted state on error too
      }
    };

    initializeStates();
  }, []);

  // Listener for background script updates (e.g., if content script toggles state)
  useEffect(() => {
    const messageListener = (message, sender, sendResponse) => {
      if (message.action === 'UPDATE_POPUP_STATE') {
        if (typeof message.borderMode !== 'undefined') {
          setBorderMode(message.borderMode);
        }
        if (typeof message.inspectorMode !== 'undefined') {
          setInspectorMode(message.inspectorMode);
        }
      }
    };
    chrome.runtime.onMessage.addListener(messageListener);
    return () => chrome.runtime.onMessage.removeListener(messageListener);
  }, []);

  return (
    <div style={{ padding: '16px', width: '272px' }}>
      <Header />
      <Divider size='middle' />
      <RestrictedMessage isVisible={isRestricted} />
      {!isRestricted && (
        <Space direction='vertical' size='small' style={{ width: '100%' }}>
          <Space direction='vertical' size='middle' style={{ width: '100%' }}>
            <FeatureToggle
              label='Border Mode'
              id='border-mode'
              checked={borderMode}
              onChange={handleToggleBorderMode}
              ariaLabel='Enable or disable borders'
            />
            <FeatureToggle
              label='Inspector Mode'
              id='inspector-mode'
              checked={inspectorMode}
              onChange={handleToggleInspectorMode}
              ariaLabel='Enable or disable inspector mode'
            />
          </Space>
          <Divider size='middle' />
          <BorderSettings
            borderSize={borderSize}
            borderStyle={borderStyle}
            onUpdate={handleUpdateBorderSettings}
          />
          <Divider size='small' />
          <ScreenshotSection
            hasPermission={hasDownloadPermission}
            onRequestPermission={requestDownloadPermission}
            onCaptureScreenshot={handleCaptureScreenshot}
          />
        </Space>
      )}
      <Divider size='middle' />
      <Footer />
    </div>
  );
}
