import { Layout, theme, Typography } from 'antd';

const { useToken } = theme;
const { Title } = Typography;

interface HeaderProps {}

/**
 * Displays the header title for the popup.
 *
 * @returns {JSX.Element} A header with the title "Border Patrol".
 */
export default function Header() {
  const { token } = useToken();

  const titleStyle = {
    fontFamily: '"Grandstander", "Inter", Arial, sans-serif',
    fontSize: '1.6rem',
    fontWeight: 700,
    fontStyle: 'normal',
    textAlign: 'center',
    color: token.colorPrimary,
    border: `3px dashed ${token.colorPrimary}`,
    borderRadius: '10px',
    padding: '4px 8px',
    margin: 0,
  };

  return (
    <Layout.Header>
      <Title level={1} style={titleStyle}>
        Border Patrol
      </Title>
    </Layout.Header>
  );
}
