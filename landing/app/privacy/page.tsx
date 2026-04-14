import type { Metadata } from 'next';
import Nav from '../../components/Nav';
import Footer from '../../components/Footer';

export const metadata: Metadata = {
  title: 'Privacy Policy - Border Patrol',
  description: 'Privacy policy for the Border Patrol Chrome extension.',
  alternates: { canonical: 'https://border-patrol.seasav.ca/privacy/' },
  openGraph: {
    url: 'https://border-patrol.seasav.ca/privacy/',
    title: 'Privacy Policy - Border Patrol',
    description: 'Privacy policy for the Border Patrol Chrome extension.',
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

export default function PrivacyPage() {
  return (
    <>
      <Nav />

      <div style={{ borderBottom: '1px solid var(--border-color)', background: 'var(--card-background)' }}>
        <div className="container" style={{ paddingTop: '3rem', paddingBottom: '3rem' }}>
          <p style={{ fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--bp-blue-500)', marginBottom: '0.75rem' }}>
            Legal
          </p>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Privacy Policy</h1>
          <p style={{ color: 'var(--light-text-color)', marginBottom: 0 }}>
            Last updated: April 14, 2026 &nbsp;·&nbsp; Applies to the Border Patrol Chrome extension and this website
          </p>
        </div>
      </div>

      <main className="container" style={{ paddingTop: '2.5rem', paddingBottom: '5rem' }}>
        <p style={{ fontSize: '1.1rem', lineHeight: 1.8, maxWidth: '800px' }}>
          Border Patrol is a developer tool — nothing more. It does not have a backend, does not create
          accounts, and does not communicate with any server. This policy explains what the extension
          accesses and why, in plain language.
        </p>

        <h2 style={sectionHeading}>The short version</h2>
        <p>
          Border Patrol collects absolutely no personal data. Everything the extension does happens
          locally in your browser. No information about you, the pages you visit, or your debugging
          sessions is ever sent anywhere.
        </p>

        <h2 style={sectionHeading}>What the extension accesses</h2>
        <p>
          To do its job, Border Patrol reads the DOM structure of the active tab. This is how it
          draws outlines around elements, computes margin and padding overlays, and displays
          inspector data. This access is scoped to the current tab and is never stored beyond your
          browser session, and never transmitted.
        </p>
        <p>
          The screenshot feature uses Chrome&apos;s built-in capture API via an offscreen document.
          The image is rendered in memory and immediately downloaded to your device. No screenshot
          data is held in extension storage or sent anywhere.
        </p>

        <h2 style={sectionHeading}>Local storage</h2>
        <p>
          The extension uses <code>chrome.storage.local</code> to remember your preferences between
          sessions — things like your chosen border size, style, and which features are active. This
          data lives only in your browser. It is never synced to a server, and SeaSav Labs Inc. has
          no access to it.
        </p>

        <h2 style={sectionHeading}>This website</h2>
        <p>
          This landing page is a static Next.js site. It does not use cookies, tracking pixels,
          session identifiers, or any analytics service. There is no login, no form submission, and
          no data collected from visitors.
        </p>

        <h2 style={sectionHeading}>Third parties</h2>
        <p>
          Border Patrol has no third-party integrations. It does not include advertising SDKs,
          crash reporting services, or telemetry of any kind.
        </p>

        <h2 style={sectionHeading}>Open source &amp; transparency</h2>
        <p>
          Border Patrol is open source and developed in the open at{' '}
          <a href="https://github.com/seasav/border-patrol" target="_blank" rel="noopener noreferrer">
            github.com/seasav/border-patrol
          </a>
          . The source code is public so the community can audit exactly what the extension does,
          report issues, and contribute improvements. The code and all Border Patrol branding remain
          the property of SeaSav Labs Inc.
        </p>

        <h2 style={sectionHeading}>Changes to this policy</h2>
        <p>
          If we ever change this policy, the updated version will be posted here with a revised
          date. Given that Border Patrol does not collect data, we don&apos;t anticipate meaningful
          changes.
        </p>

        <h2 style={sectionHeading}>Contact</h2>
        <p>
          Questions or concerns? Open an issue on the{' '}
          <a href="https://github.com/seasav/border-patrol/issues" target="_blank" rel="noopener noreferrer">
            GitHub repository
          </a>
          .
        </p>
      </main>

      <Footer />
    </>
  );
}
