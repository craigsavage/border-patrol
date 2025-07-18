import { Space, Divider } from 'antd';

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

  return (
    <>
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
    </>
  );
}
