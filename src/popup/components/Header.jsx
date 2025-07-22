import { Layout, theme, Typography } from 'antd';

const { useToken } = theme;
const { Title } = Typography;

/**
 * Displays the header title for the popup.
 *
 * @returns {JSX.Element} A header with the title "Border Patrol".
 */
export default function AppHeader() {
  const { token } = useToken();

  const headerStyle = {
    fontFamily: 'Grandstander, Inter, sans-serif',
    fontSize: '1.6rem',
    fontWeight: 700,
    fontStyle: 'normal',
    textAlign: 'center',
    color: token.colorPrimary,
    border: `3px dashed ${token.colorPrimary}`,
    borderRadius: '10px',
    padding: '8px',
    margin: 0,
  };

  return (
    <Layout.Header style={{ padding: 0, height: 'auto' }}>
      <Title level={1} style={headerStyle}>
        Border Patrol
      </Title>
    </Layout.Header>
  );
}
