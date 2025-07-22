import { Layout, Typography } from 'antd';

const { Link } = Typography;

const footerStyle = {
  fontSize: '0.8rem',
  textAlign: 'center',
  padding: 0,
};

/**
 * Footer component for the popup.
 * Displays the Border Patrol website link and version number.
 *
 * @returns {JSX.Element} A footer with a link to the Border Patrol website and version number.
 */
export default function AppFooter() {
  return (
    <Layout.Footer style={footerStyle}>
      <Link
        href='https://craigsavage.github.io/border-patrol/'
        target='_blank'
        aria-label='Border Patrol Website'
        style={{ color: 'var(--bp-gray)' }}
      >
        Border Patrol <span className='version'>v1.3.2</span>
      </Link>
    </Layout.Footer>
  );
}
