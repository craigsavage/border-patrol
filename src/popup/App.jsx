import { Space, Divider, ConfigProvider, theme } from 'antd';
import { useState, useEffect } from 'react';

// Utils
import Logger from '../scripts/utils/logger.js';

// Hooks
import { useExtensionSettings } from './hooks/useExtensionSettings';
import { useScreenshotCapture } from './hooks/useScreenshotCapture.js';

// Components
import Header from './components/Header.jsx';
import RestrictedMessage from './components/RestrictedMessage';
import FeatureToggle from './components/FeatureToggle';
import BorderSettings from './components/BorderSettings';
import ScreenshotSection from './components/ScreenshotSection';
import Footer from './components/Footer';

/**
 * App component renders the popup UI for the extension.
 *
 * It uses two custom hooks:
 * - useExtensionSettings: Manages extension state and settings.
 * - useScreenshotCapture: Handles screenshot capture and permissions.
 *
 * If the extension is restricted, only the RestrictedMessage is shown.
 * Otherwise, it displays toggles for Border and Inspector modes, border settings,
 * screenshot controls, and a footer.
 *
 * @returns {JSX.Element} Popup UI for the extension.
 */
export default function App() {
  const {
    isRestricted,
    borderMode,
    inspectorMode,
    borderSize,
    borderStyle,
    handleToggleBorderMode,
    handleToggleInspectorMode,
    handleUpdateBorderSettings,
  } = useExtensionSettings();

  const {
    hasDownloadPermission,
    requestDownloadPermission,
    handleCaptureScreenshot,
  } = useScreenshotCapture(isRestricted);

  const [darkMode, setDarkMode] = useState(false);

  /**
   * Toggles dark mode on or off.
   *
   * @param {boolean} checked - True if dark mode is enabled, false otherwise.
   */
  const handleToggleDarkMode = async checked => {
    setDarkMode(checked);
    // Save the dark mode preference to local storage
    try {
      await chrome.storage.local.set({ darkMode: checked });
      Logger.info(`Dark mode preference saved: ${checked}`);
    } catch (error) {
      Logger.error('Error saving dark mode preference:', error);
    }
  };

  // Loads the dark mode preference from local storage when the component mounts.
  useEffect(() => {
    const loadDarkModePreference = async () => {
      try {
        const { darkMode: savedDarkMode } = await chrome.storage.local.get(
          'darkMode'
        );

        // If a preference is found, set it; otherwise, default to light mode
        if (savedDarkMode !== undefined) {
          handleToggleDarkMode(savedDarkMode);
        } else {
          Logger.warn(
            'No dark mode preference found, defaulting to light mode.'
          );
          handleToggleDarkMode(false);
        }
      } catch (error) {
        Logger.error('Error loading dark mode preference:', error);
      }
    };
    loadDarkModePreference();
  }, []);

  return (
    <ConfigProvider
      theme={{
        algorithm: darkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
      }}
    >
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

          <Divider size='small' />

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
    </ConfigProvider>
  );
}
