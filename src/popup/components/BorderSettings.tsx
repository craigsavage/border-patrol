import { Form, Slider, Select, Card } from 'antd';
import type { BorderSettingsProps } from '../../types/popup/components';
import { useTranslation } from '../hooks/useTranslation';

/** Component for border settings. Allows users to adjust the border size and style. */
export default function BorderSettings({
  borderSize,
  borderStyle,
  onUpdateBorderSettings,
}: BorderSettingsProps): React.ReactElement {
  const { translate } = useTranslation();

  /**
   * Handles changes to the border size.
   * @param value The new size value selected by the user.
   */
  const handleSizeChange = (value: number) => {
    onUpdateBorderSettings(value, borderStyle);
  };

  /**
   * Handles changes to the border style.
   * @param value The new style value selected by the user.
   */
  const handleStyleChange = (value: string) => {
    onUpdateBorderSettings(borderSize, value);
  };

  return (
    <Card
      title={translate('borderSettings')}
      size='small'
      style={{ width: '100%' }}
    >
      <Form layout='vertical' name='borderSettings'>
        <Form.Item label='Size' style={{ marginBottom: '4px' }}>
          <Slider
            min={1}
            max={3}
            step={0.5}
            value={borderSize}
            onChange={handleSizeChange}
            aria-label='Border size'
            tooltip={{ formatter: value => `${value}px` }}
          />
        </Form.Item>

        <Form.Item label='Style' style={{ marginBottom: '4px' }}>
          <Select
            value={borderStyle}
            onChange={handleStyleChange}
            aria-label='Border style'
            style={{ width: '100%' }}
            size='small'
            options={[
              { value: 'solid', label: 'Solid' },
              { value: 'dashed', label: 'Dashed' },
              { value: 'dotted', label: 'Dotted' },
              { value: 'double', label: 'Double' },
            ]}
          />
        </Form.Item>
      </Form>
    </Card>
  );
}
