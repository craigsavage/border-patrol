import { Space, Switch, Typography } from 'antd';

const { Text } = Typography;

export default function FeatureToggle({label, id, checked, onChange, ariaLabel}) {
    return (
        <Space align="center" style={{ display: 'flex', justifyContent: 'space-between'}}>
            <Text strong>{label}</Text>
            <Switch
                id={id}
                checkedChildren="Enabled"
                unCheckedChildren="Disabled"
                checked={checked}
                onChange={onChange}
                aria-label={ariaLabel}
            />
        </Space>
    );
}
