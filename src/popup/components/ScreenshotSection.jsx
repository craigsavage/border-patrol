import { useState } from 'react';
import { Button, Space, Alert } from 'antd';

export default function ScreenshotSection({
  hasPermission,
  onRequestPermission,
  onCaptureScreenshot,
}) {
  const [isCapturing, setIsCapturing] = useState(false);
  const [notification, setNotification] = useState(null);

  const handleTakeScreenshot = async () => {
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

    const success = await onCaptureScreenshot();

    if (success) {
      setNotification({ message: 'Screenshot captured!', type: 'success' });
    } else {
      setNotification({
        message: 'Failed to capture screenshot',
        type: 'error',
      });
    }

    setTimeout(() => {
      setIsCapturing(false);
      setNotification(null);
    }, 2000); // Clear message after 2 seconds
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
