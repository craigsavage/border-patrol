import { useState } from 'react';
import { Button, Space, Alert, Segmented } from 'antd';
import type {
  ScreenshotSectionProps,
  NotificationType,
} from '../../types/popup/components';
import { useTranslation } from '../hooks/useTranslation';

type CaptureMode = 'visible' | 'fullPage';

/**
 * A component that handles screenshot capture permission and capture process.
 *
 * Provides a segmented control to choose between a visible-area screenshot and a
 * full-page (scroll-and-stitch) screenshot before triggering the capture.
 *
 * It checks if the user has granted download permission.
 * If permission is not granted, it requests permission from the user first.
 * If permission is granted, it captures the screenshot using the selected mode.
 */
export default function ScreenshotSection({
  hasDownloadPermission,
  onRequestPermission,
  onCaptureScreenshot,
  onCaptureFullScreenshot,
}: ScreenshotSectionProps): React.ReactElement {
  const { translate } = useTranslation();
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const [captureMode, setCaptureMode] = useState<CaptureMode>('visible');
  const [notification, setNotification] = useState<NotificationType | null>(
    null,
  );

  /**
   * Handles the screenshot capture process for the selected mode.
   *
   * Checks for download permission, requests it if needed, then delegates
   * to either the visible-area or full-page capture handler.
   */
  const handleTakeScreenshot = async () => {
    if (
      !onRequestPermission ||
      !onCaptureScreenshot ||
      !onCaptureFullScreenshot
    ) {
      console.error('Screenshot capture handlers are not available');
      return;
    }

    if (!hasDownloadPermission) {
      const granted = await onRequestPermission();
      if (!granted) {
        setNotification({
          message: translate('downloadPermissionDenied'),
          type: 'error',
        });
        setTimeout(() => setNotification(null), 3000);
        return;
      }
    }

    setIsCapturing(true);
    setNotification({ message: translate('capturing'), type: 'info' });

    try {
      if (captureMode === 'fullPage') {
        await onCaptureFullScreenshot();
      } else {
        await onCaptureScreenshot();
      }
    } catch (error) {
      console.error('Error in handleTakeScreenshot:', error);
    } finally {
      setIsCapturing(false);
      setNotification(null);
    }
  };

  return (
    <Space orientation='vertical' style={{ width: '100%' }}>
      {!hasDownloadPermission && (
        <Alert
          title={translate('downloadPermissionRequired')}
          type='warning'
          action={
            <Button size='small' type='primary' onClick={onRequestPermission}>
              {translate('grantPermission')}
            </Button>
          }
          style={{ marginBottom: '8px' }}
        />
      )}
      <Segmented
        block
        value={captureMode}
        onChange={value => setCaptureMode(value as CaptureMode)}
        options={[
          { label: translate('screenshotModeVisible'), value: 'visible' },
          { label: translate('screenshotModeFullPage'), value: 'fullPage' },
        ]}
        disabled={isCapturing}
      />
      {notification && (
        <Alert
          title={notification.message}
          type={notification.type}
          style={{ width: '100%' }}
        />
      )}
      <Button
        type='primary'
        onClick={handleTakeScreenshot}
        disabled={isCapturing}
        block
      >
        {isCapturing
          ? translate('capturing')
          : '📸 ' + translate('takeScreenshot')}
      </Button>
    </Space>
  );
}
