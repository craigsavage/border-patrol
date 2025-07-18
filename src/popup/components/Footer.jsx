import { Typography } from 'antd';

const { Link } = Typography;

const footerStyle = {
  fontSize: '0.8rem',
  textAlign: 'center',
};

export default function Footer() {
  return (
    <footer style={footerStyle}>
      <Link
        href='https://craigsavage.github.io/border-patrol/'
        target='_blank'
        aria-label='Border Patrol Website'
        style={{ color: 'var(--bp-gray)' }}
      >
        Border Patrol <span className='version'>v1.3.2</span>
      </Link>
    </footer>
  );
}
