import { Typography } from 'antd';

const { Title } = Typography;

const headerStyle = {
  fontFamily: 'Grandstander, Inter, sans-serif',
  fontSize: '1.6rem',
  fontWeight: 700,
  fontStyle: 'normal',
  textAlign: 'center',
  color: 'var(--bp-blue)',
  border: '3px dashed var(--bp-blue)',
  borderRadius: '10px',
  padding: '8px',
  margin: 0,
};

/**
 * Displays the header title for the popup.
 *
 * @returns {JSX.Element} A header with the title "Border Patrol".
 */
export default function Header() {
  return (
    <header>
      <Title level={1} style={headerStyle}>
        Border Patrol
      </Title>
    </header>
  );
}
