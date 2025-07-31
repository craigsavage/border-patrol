import { useState } from 'react';
import { Button, Space, Alert } from 'antd';

/**
 * A component that handles screenshot capture permission and capture process.
 *
 * It checks if the user has granted download permission.
 * If permission is not granted, it requests permission from the user first.
 * If permission is granted, it captures the screenshot.
 * It displays success or error notifications after the capture process.
 *
 * @param {Object} props - The component props.
 * @param {boolean} props.hasPermission - Indicates if the user has download permission.
 * @param {Function} props.onRequestPermission - Function to request download permission.
 * @param {Function} props.onCaptureScreenshot - Function to handle the screenshot capture process.
 * @returns {JSX.Element} A button to capture screenshot and notifications for the result.
 */
export default function ScreenshotSection({
  hasPermission,
  onRequestPermission,
  onCaptureScreenshot,
}) {
  const [isCapturing, setIsCapturing] = useState(false);
  const [notification, setNotification] = useState(null);

  /**
   * Handles the screenshot capture process.
   * It checks for download permission, and if granted, it captures the screenshot.
   * If permission is not granted, it requests permission from the user first.
   *
   * @returns {Promise<void>} Resolves when the screenshot is captured or an error occurs.
   */
  const handleTakeScreenshot = async () => {
    if (!onRequestPermission || !onCaptureScreenshot) {
      console.error(
        'onRequestPermission or onCaptureScreenshot is null or undefined'
      );
      return;
    }

    if (!hasPermission) {
      const granted = await onRequestPermission();
      if (!granted) {
        setNotification({
          message: 'Download permission denied',
          type: 'error',
        });
        setTimeout(() => setNotification(null), 3000);
        return;
      }
    }

    setIsCapturing(true);
    setNotification({ message: 'Capturing...', type: 'info' });

    try {
      const success = await onCaptureScreenshot();

      // if (success) {
      //   setNotification({ message: 'Screenshot captured!', type: 'success' });
      // } else {
      //   setNotification({
      //     message: 'Failed to capture screenshot',
      //     type: 'error',
      //   });
      // }
    } catch (error) {
      console.error('Error in handleTakeScreenshot:', error);
      // setNotification({
      //   message: 'Internal error occurred',
      //   type: 'error',
      // });
    } finally {
      // setTimeout(() => {
      //   setIsCapturing(false);
      //   setNotification(null);
      // }, 2000); // Clear message after 2 seconds
    }
  };

  return (
    <Space direction='vertical' style={{ width: '100%' }}>
      {!hasPermission && (
        <Alert
          message='Download permission required for screenshots'
          type='warning'
          action={
            <Button size='small' type='primary' onClick={onRequestPermission}>
              Grant Permission
            </Button>
          }
          style={{ marginBottom: '8px' }}
        />
      )}
      {notification && (
        <Alert
          message={notification.message}
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
        {isCapturing ? 'Capturing...' : '📸 Take Screenshot'}
      </Button>
    </Space>
  );
}
