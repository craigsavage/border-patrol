import { Form, Slider, Select, Card } from 'antd';

/**
 * Component for border settings.
 * Allows users to adjust the border size and style.
 *
 * @param {Object} props - The component props.
 * @param {number} props.borderSize - The current size of the border.
 * @param {string} props.borderStyle - The current style of the border.
 * @param {Function} props.onUpdate - Function to call when border settings are updated.
 * @returns {JSX.Element} A form with sliders and selects for border settings.
 */
export default function BorderSettings({ borderSize, borderStyle, onUpdate }) {
  /**
   * Handles the change event for the border size input.
   * Calls the onUpdate callback with the new size value and the current border style.
   *
   * @param {number|string} value - The new size value selected by the user.
   */
  const handleSizeChange = value => {
    onUpdate(value, borderStyle);
  };

  /**
   * Handles the change event for the border style select.
   * Calls the onUpdate callback with the current border size and the new style value.
   * @param {string} value - The new style value selected by the user.
   */
  const handleStyleChange = value => {
    onUpdate(borderSize, value);
  };

  return (
    <Card title='Border Settings' size='small' style={{ width: '100%' }}>
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
