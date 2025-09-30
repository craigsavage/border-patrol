import { Space, Divider, ConfigProvider, theme, Layout } from 'antd';

// Hooks
import { useExtensionSettings } from './hooks/useExtensionSettings';
import { useScreenshotCapture } from './hooks/useScreenshotCapture.js';
import { useDarkMode } from './hooks/useDarkMode.js';

// Components
import Header from './components/Header';
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

  const { isDarkMode, handleToggleDarkMode } = useDarkMode();

  return (
    <ConfigProvider
      theme={{
        algorithm: isDarkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          colorPrimary: '#2374ab', // Ant Design primary color (Border Patrol blue)
          colorBgContainer: isDarkMode ? '#141414' : '#f5f5f5', // Background color for containers
          colorText: isDarkMode ? '#f2f8fd' : '#132a3e', // Text color
        },
        components: {
          Layout: {
            headerBg: 'transparent',
            headerHeight: 'auto',
            headerPadding: 0,
            footerPadding: 0,
          },
        },
      }}
    >
      <Layout style={{ padding: '16px', width: '100%' }}>
        <Header />
        <Divider size='middle' />

        <RestrictedMessage isVisible={isRestricted} />

        {!isRestricted && (
          <Space direction='vertical' size={4} style={{ width: '100%' }}>
            <Space direction='vertical' size='middle' style={{ width: '100%' }}>
              <FeatureToggle
                label='Border Mode'
                id='border-mode'
                checked={borderMode}
                onChange={handleToggleBorderMode}
                ariaLabel='Enable or disable borders'
                commandName='toggle_border_patrol'
              />
              <FeatureToggle
                label='Inspector Mode'
                id='inspector-mode'
                checked={inspectorMode}
                onChange={handleToggleInspectorMode}
                ariaLabel='Enable or disable inspector mode'
                commandName='toggle_inspector_mode'
              />
            </Space>

            <Divider size='small' />

            <BorderSettings
              borderSize={borderSize}
              borderStyle={borderStyle}
              onUpdateBorderSettings={handleUpdateBorderSettings}
            />

            <Divider size='small' />

            <ScreenshotSection
              hasDownloadPermission={hasDownloadPermission}
              onRequestPermission={requestDownloadPermission}
              onCaptureScreenshot={handleCaptureScreenshot}
            />
          </Space>
        )}

        <Divider size='middle' />
        <Footer
          isDarkMode={isDarkMode}
          onToggleDarkMode={handleToggleDarkMode}
        />
      </Layout>
    </ConfigProvider>
  );
}
