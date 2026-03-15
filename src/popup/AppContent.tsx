import { useState, useEffect } from 'react';
import { Space, Divider, Layout, Collapse } from 'antd';

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
    measurementMode,
    borderSize,
    borderStyle,
    handleToggleBorderMode,
    handleToggleInspectorMode,
    handleToggleMeasurementMode,
    handleUpdateBorderSettings,
  } = useExtensionSettings();

  const {
    hasDownloadPermission,
    requestDownloadPermission,
    handleCaptureScreenshot,
    handleCaptureFullScreenshot,
  } = useScreenshotCapture(isRestricted);

  const { translate } = useTranslation();

  const [settingsOpen, setSettingsOpen] = useState<boolean>(borderMode);

  useEffect(() => {
    setSettingsOpen(borderMode);
  }, [borderMode]);

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
            />
            <Collapse
              size='small'
              activeKey={settingsOpen ? ['settings'] : []}
              onChange={keys =>
                setSettingsOpen(
                  Array.isArray(keys)
                    ? keys.includes('settings')
                    : keys === 'settings',
                )
              }
              items={[
                {
                  key: 'settings',
                  label: translate('borderSettings'),
                  children: (
                    <BorderSettings
                      compact
                      borderSize={borderSize}
                      borderStyle={borderStyle}
                      onUpdateBorderSettings={handleUpdateBorderSettings}
                    />
                  ),
                },
              ]}
            />
            <FeatureToggle
              label={translate('inspectorMode')}
              id='inspector-mode'
              checked={inspectorMode}
              onChange={handleToggleInspectorMode}
              ariaLabel={translate('enableOrDisableInspectors')}
            />
            <FeatureToggle
              label={translate('measurementMode')}
              id='measurement-mode'
              checked={measurementMode}
              onChange={handleToggleMeasurementMode}
              ariaLabel={translate('enableOrDisableMeasurement')}
            />
          </Space>

          <Divider size='small' />

          <ScreenshotSection
            hasDownloadPermission={hasDownloadPermission}
            onRequestPermission={requestDownloadPermission}
            onCaptureScreenshot={handleCaptureScreenshot}
            onCaptureFullScreenshot={handleCaptureFullScreenshot}
          />
        </Space>
      )}

      <Divider size='middle' />
      <Footer />
    </Layout>
  );
}
