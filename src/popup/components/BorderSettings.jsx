import { Form, Slider, Select, Card } from 'antd';

const { Option } = Select;

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
        <Form.Item label='Size' name='borderSize'>
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

        <Form.Item label='Style' name='borderStyle'>
          <Select
            value={borderStyle}
            onChange={handleStyleChange}
            aria-label='Border style'
            style={{ width: '100%' }}
          >
            <Option value='solid'>Solid</Option>
            <Option value='dashed'>Dashed</Option>
            <Option value='dotted'>Dotted</Option>
            <Option value='double'>Double</Option>
          </Select>
        </Form.Item>
      </Form>
    </Card>
  );
}
