import Link from 'next/link';

export default function Nav() {
  return (
    <nav className="main-nav">
      <div className="nav-container">
        <div className="nav-content">
          <div className="nav-brand">
            <Link href="/">
              <img
                src="/assets/img/border-patrol-logo.svg"
                alt="Border Patrol Logo"
                className="nav-logo"
                width={32}
                height={32}
              />
              <span className="nav-title">Border Patrol</span>
            </Link>
          </div>
          <div className="nav-cta">
            <a
              href="https://chromewebstore.google.com/detail/fdkdknepjdabfaihhdljlbbcjiahmkkd?utm_source=item-share-cb"
              className="nav-button button"
              target="_blank"
              rel="noopener noreferrer"
            >
              Get Border Patrol
            </a>
          </div>
        </div>
      </div>
    </nav>
  );
}
