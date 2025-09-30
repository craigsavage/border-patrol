import { Layout, theme, Typography } from 'antd';
import type { HeaderProps } from '../../types/popup/components';

const { useToken } = theme;
const { Title } = Typography;

/** Displays the header title for the popup. */
export default function Header(props: HeaderProps): React.ReactElement {
  const { token } = useToken();

  const titleStyle: React.CSSProperties = {
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
