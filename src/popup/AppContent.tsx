import { Space, Divider, Layout } from 'antd';

// Hooks
import { useExtensionSettings } from './hooks/useExtensionSettings';
import { useScreenshotCapture } from './hooks/useScreenshotCapture';
import { useTranslation } from './hooks/useTranslation';

// Components
import Header from './components/Header';
import RestrictedMessage from './components/RestrictedMessage';
import FeatureToggle from './components/FeatureToggle';
import BorderSettings from './components/BorderSettings';
import ScreenshotSection from './components/ScreenshotSection';
import Footer from './components/Footer';

/** Main content component for the popup application. */
export default function AppContent(): React.ReactElement {
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

  const { translate } = useTranslation();

  return (
    <Layout style={{ padding: '16px', width: '100%' }}>
      <Header />
      <Divider size='middle' />

      <RestrictedMessage isVisible={isRestricted} />

      {!isRestricted && (
        <Space orientation='vertical' size={4} style={{ width: '100%' }}>
          <Space orientation='vertical' size='middle' style={{ width: '100%' }}>
            <FeatureToggle
              label={translate('borderMode')}
              id='border-mode'
              checked={borderMode}
              onChange={handleToggleBorderMode}
              ariaLabel={translate('enableOrDisableBorders')}
              commandName='toggle_border_patrol'
            />
            <FeatureToggle
              label={translate('inspectorMode')}
              id='inspector-mode'
              checked={inspectorMode}
              onChange={handleToggleInspectorMode}
              ariaLabel={translate('enableOrDisableInspectors')}
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
      <Footer />
    </Layout>
  );
}
