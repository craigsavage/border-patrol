import { Alert } from 'antd';
import type { RestrictedMessageProps } from '../../types/popup/components';
import { useTranslation } from '../hooks/useTranslation';

/** Displays a restricted message if the extension is restricted. */
export default function RestrictedMessage({
  isVisible,
}: RestrictedMessageProps): React.ReactElement | null {
  if (!isVisible) return null;

  const { translate } = useTranslation();

  return (
    <div style={{ marginBottom: '16px' }}>
      <Alert
        title={translate('restricted')}
        description={translate('restrictedDescription')}
        type='warning'
      />
    </div>
  );
}
