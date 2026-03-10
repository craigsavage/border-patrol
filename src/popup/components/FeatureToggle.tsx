import { Flex, Switch, Tooltip, Typography } from 'antd';
import type { FeatureToggleProps } from '../../types/popup/components';
import { useTranslation } from '../hooks/useTranslation';

const { Text } = Typography;

/** A toggle switch component that allows users to enable or disable a feature. */
export default function FeatureToggle({
  label,
  id,
  checked,
  onChange,
  ariaLabel,
}: FeatureToggleProps): React.ReactElement {
  const { translate } = useTranslation();

  return (
    <Flex justify='space-between' align='center'>
      <Text strong style={{ cursor: 'default' }}>
        {label}
      </Text>
      <Switch
        id={id}
        checkedChildren={translate('enabled')}
        unCheckedChildren={translate('disabled')}
        checked={checked}
        onChange={onChange}
        aria-label={ariaLabel}
      />
    </Flex>
  );
}
