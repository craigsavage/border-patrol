import { Flex, Switch, Typography } from 'antd';
import type { FeatureToggleProps } from '../../types/popup/components';
import ShortcutInfo from './ShortcutInfo';

const { Text } = Typography;

/** A toggle switch component that allows users to enable or disable a feature. */
export default function FeatureToggle({
  label,
  id,
  checked,
  onChange,
  ariaLabel,
  commandName,
}: FeatureToggleProps): React.ReactElement {
  return (
    <>
      <Flex justify='space-between' align='center'>
        <Text strong>{label}</Text>
        <Switch
          id={id}
          checkedChildren='Enabled'
          unCheckedChildren='Disabled'
          checked={checked}
          onChange={onChange}
          aria-label={ariaLabel}
        />
      </Flex>
      <ShortcutInfo command={commandName} />
    </>
  );
}
