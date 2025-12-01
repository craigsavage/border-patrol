import { Alert } from 'antd';
import type { RestrictedMessageProps } from '../../types/popup/components';

/** Displays a restricted message if the extension is restricted. */
export default function RestrictedMessage({
  isVisible,
}: RestrictedMessageProps): React.ReactElement | null {
  if (!isVisible) return null;

  return (
    <div style={{ marginBottom: '16px' }}>
      <Alert
        message='Restricted Page'
        description='This page is restricted.'
        type='warning'
      />
    </div>
  );
}
