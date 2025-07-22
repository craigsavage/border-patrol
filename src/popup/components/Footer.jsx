import { Layout, Typography } from 'antd';
import { MoonFilled, SunFilled } from '@ant-design/icons';

const { Link } = Typography;

const footerStyle = {
  fontSize: '0.8rem',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  textAlign: 'center',
};

const iconStyle = {
  color: 'var(--bp-gray)',
  fontSize: '1.1rem',
  cursor: 'pointer',
};

/**
 * Footer component for the popup.
 * Displays the Border Patrol website link and version number.
 *
 * @returns {JSX.Element} A footer with a link to the Border Patrol website and version number.
 */
export default function Footer({ isDarkMode, onToggleDarkMode }) {
  return (
    <Layout.Footer style={footerStyle}>
      <span style={{ flex: 1 }}></span>
      <Link
        href='https://craigsavage.github.io/border-patrol/'
        target='_blank'
        aria-label='Border Patrol Website'
        style={{ color: 'var(--bp-gray)' }}
      >
        Border Patrol <span className='version'>v1.3.2</span>
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
    </Layout.Footer>
  );
}
