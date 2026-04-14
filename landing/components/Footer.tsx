import Link from 'next/link';

export default function Footer() {
  return (
    <footer>
      <div className="footer-top">
        <div className="container">
          <div className="footer-layout">
            <div className="footer-brand">
              <Link href="/" className="footer-brand-link">
                <img
                  src="/assets/img/border-patrol-logo.svg"
                  alt="Border Patrol Logo"
                  width={28}
                  height={28}
                />
                <span className="footer-brand-name">Border Patrol</span>
              </Link>
              <p className="footer-tagline">&ldquo;Stop guessing, start seeing.&rdquo;</p>
            </div>

            <nav className="footer-links">
              <Link href="/changelog/">Changelog</Link>
              <Link href="/privacy/">Privacy Policy</Link>
              <Link href="/terms/">Terms of Use</Link>
              <a
                href="https://seasav.ca"
                target="_blank"
                rel="noopener noreferrer"
                className="footer-company-link"
              >
                SeaSav Labs Inc. &rarr;
              </a>
            </nav>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="container">
          <p>&copy; 2026 SeaSav Labs Inc. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
