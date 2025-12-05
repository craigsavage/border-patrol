import { Layout, theme, Typography } from 'antd';
import { useTranslation } from '../hooks/useTranslation';

const { useToken } = theme;
const { Title } = Typography;

/** Displays the header title for the popup. */
export default function Header(): React.ReactElement {
  const { token } = useToken();
  const { translate } = useTranslation();

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
        {translate('extensionName')}
      </Title>
    </Layout.Header>
  );
}
