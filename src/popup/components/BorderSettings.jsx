import { Form, Slider, Select, Card } from 'antd';

export default function BorderSettings({ borderSize, borderStyle, onUpdate }) {
  const handleSizeChange = value => {
    onUpdate(value, borderStyle);
  };

  const handleStyleChange = value => {
    onUpdate(borderSize, value);
  };

  return (
    <Card title='Border Settings' size='small' style={{ width: '100%' }}>
      <Form layout='vertical' name='borderSettings'>
        <Form.Item
          label='Size'
          name='borderSize'
          style={{ marginBottom: '4px' }}
        >
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

        <Form.Item
          label='Style'
          name='borderStyle'
          style={{ marginBottom: '4px' }}
        >
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
