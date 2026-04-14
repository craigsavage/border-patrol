import type { Metadata } from 'next';
import Nav from '../../components/Nav';
import Footer from '../../components/Footer';

export const metadata: Metadata = {
  title: 'Terms of Use - Border Patrol',
  description: 'Terms of use for the Border Patrol Chrome extension.',
  alternates: { canonical: 'https://border-patrol.seasav.ca/terms/' },
  openGraph: {
    url: 'https://border-patrol.seasav.ca/terms/',
    title: 'Terms of Use - Border Patrol',
    description: 'Terms of use for the Border Patrol Chrome extension.',
  },
};

const sectionHeading: React.CSSProperties = {
  textAlign: 'left',
  fontSize: '1.2rem',
  fontWeight: 700,
  color: 'var(--bp-blue-900)',
  marginTop: '2.5rem',
  marginBottom: '0.75rem',
  paddingBottom: '0.5rem',
  borderBottom: '2px solid var(--bp-blue-200)',
};

export default function TermsPage() {
  return (
    <>
      <Nav />

      <div style={{ borderBottom: '1px solid var(--border-color)', background: 'var(--card-background)' }}>
        <div className="container" style={{ paddingTop: '3rem', paddingBottom: '3rem' }}>
          <p style={{ fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--bp-blue-500)', marginBottom: '0.75rem' }}>
            Legal
          </p>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Terms of Use</h1>
          <p style={{ color: 'var(--light-text-color)', marginBottom: 0 }}>
            Last updated: April 14, 2026 &nbsp;·&nbsp; Applies to the Border Patrol Chrome extension and this website
          </p>
        </div>
      </div>

      <main className="container" style={{ paddingTop: '2.5rem', paddingBottom: '5rem' }}>
        <p style={{ fontSize: '1.1rem', lineHeight: 1.8, maxWidth: '800px' }}>
          Border Patrol is free, open-source software made for developers. These terms are intentionally
          brief — we want you to use the extension, not read legalese. By installing or using Border
          Patrol, you agree to the terms below.
        </p>

        <h2 style={sectionHeading}>Open source &amp; intellectual property</h2>
        <p>
          Border Patrol is developed in the open and welcomes community contributions. The source
          code is available on{' '}
          <a
            href="https://github.com/seasav/border-patrol"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub
          </a>{' '}
          — bug reports, feature suggestions, and pull requests are encouraged.
        </p>
        <p>
          The codebase is licensed under the{' '}
          <a
            href="https://github.com/seasav/border-patrol/blob/main/LICENSE"
            target="_blank"
            rel="noopener noreferrer"
          >
            MIT License
          </a>
          , but all intellectual property rights — including the source code, the Border Patrol name,
          and all associated branding and assets — remain the exclusive property of SeaSav Labs Inc.
          The MIT License governs how the code may be used and contributed to; it does not transfer
          ownership or grant rights to the Border Patrol brand.
        </p>

        <h2 style={sectionHeading}>Intended use</h2>
        <p>
          Border Patrol is a visual debugging tool for web developers. It is intended for inspecting
          CSS layouts on pages you own or have permission to inspect. You agree to use it only for
          lawful purposes and in accordance with the terms of any third-party service or platform you
          apply it to.
        </p>

        <h2 style={sectionHeading}>No warranty</h2>
        <p>
          The extension is provided &ldquo;as is&rdquo;, without warranty of any kind. SeaSav Labs
          Inc. makes no guarantees about uptime, accuracy, or fitness for a particular purpose. While
          we work hard to keep it reliable, you use it at your own risk.
        </p>

        <h2 style={sectionHeading}>Limitation of liability</h2>
        <p>
          To the fullest extent permitted by applicable law, SeaSav Labs Inc. shall not be liable for
          any direct, indirect, incidental, special, or consequential damages arising from your use
          of or inability to use the extension or this website.
        </p>

        <h2 style={sectionHeading}>Third-party platforms</h2>
        <p>
          Border Patrol is distributed through the Chrome Web Store, which is governed by
          Google&apos;s own terms of service. These terms apply only to Border Patrol itself and do
          not alter your relationship with Google or any other platform.
        </p>

        <h2 style={sectionHeading}>Changes</h2>
        <p>
          We may update these terms from time to time. Changes will be posted on this page with a
          revised date. Continued use of the extension after changes are published constitutes
          acceptance of the updated terms.
        </p>

        <h2 style={sectionHeading}>Contact</h2>
        <p>
          Questions about these terms can be raised by opening an issue on the{' '}
          <a
            href="https://github.com/seasav/border-patrol/issues"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub repository
          </a>
          .
        </p>
      </main>

      <Footer />
    </>
  );
}
