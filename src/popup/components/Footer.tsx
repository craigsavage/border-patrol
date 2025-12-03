import { Flex, Layout, Select, Typography } from 'antd';
import type { FooterProps } from '../../types/popup/components';
import DarkModeToggle from './DarkModeToggle';

const { Link } = Typography;

const footerStyle: React.CSSProperties = {
  fontSize: '0.8rem',
  display: 'grid',
  gridTemplateColumns: '1fr auto 1fr',
  alignItems: 'center',
  textAlign: 'center',
  width: '100%',
};

// Placeholder for version, will be replaced during build
const version = __BP_APP_VERSION__;

/**
 * Footer component for the popup.
 * Displays the Border Patrol website link and version number.
 */
export default function Footer({
  isDarkMode,
  onToggleDarkMode,
}: FooterProps): React.ReactElement {
  return (
    <Layout.Footer style={footerStyle}>
      <Select
        defaultValue='en'
        style={{ justifySelf: 'start' }}
        size='small'
        options={[
          { value: 'en', label: 'EN' },
          { value: 'es', label: 'ES' },
        ]}
      />

      <Link
        href='https://craigsavage.github.io/border-patrol/'
        target='_blank'
        aria-label='Border Patrol Website'
        style={{ color: 'var(--bp-gray)', justifySelf: 'center' }}
      >
        Border Patrol <span className='version'>{version}</span>
      </Link>

      <div style={{ justifySelf: 'end' }}>
        <DarkModeToggle
          isDarkMode={isDarkMode}
          onToggleDarkMode={onToggleDarkMode}
        />
      </div>
    </Layout.Footer>
  );
}
