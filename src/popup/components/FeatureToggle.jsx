import { Flex, Switch, Typography } from 'antd';

const { Text } = Typography;

/**
 * A toggle switch component that allows users to enable or disable a feature.
 *
 * @param {Object} props - The properties for the toggle switch.
 * @returns {React.FC} - A functional component that renders a toggle switch.
 */
export default function FeatureToggle({
  label,
  id,
  checked,
  onChange,
  ariaLabel,
}) {
  return (
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
  );
}
