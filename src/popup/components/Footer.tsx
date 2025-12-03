import { Flex, Layout, Select, Typography } from 'antd';
import { MoonFilled, SunFilled } from '@ant-design/icons';
import type { FooterProps } from '../../types/popup/components';

const { Link } = Typography;

const footerStyle: React.CSSProperties = {
  fontSize: '0.8rem',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  textAlign: 'center',
};

const iconStyle: React.CSSProperties = {
  color: 'var(--bp-gray)',
  fontSize: '1.1rem',
  cursor: 'pointer',
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
      <Flex
        gap='small'
        align='center'
        justify='space-between'
        style={{ width: '100%' }}
      >
        <Select
          defaultValue='en'
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
          style={{ color: 'var(--bp-gray)' }}
        >
          Border Patrol <span className='version'>{version}</span>
        </Link>
        <span style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
          {isDarkMode ? (
            <SunFilled
              style={iconStyle}
              onClick={() => onToggleDarkMode(false)}
            />
          ) : (
            <MoonFilled
              style={iconStyle}
              onClick={() => onToggleDarkMode(true)}
            />
          )}
        </span>
      </Flex>
    </Layout.Footer>
  );
}
