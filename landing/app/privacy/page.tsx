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

export default function PrivacyPage() {
  return (
    <>
      <Nav />
      <main className="container" style={{ paddingTop: '3rem', paddingBottom: '4rem', maxWidth: '760px' }}>
        <h1 style={{ marginBottom: '0.5rem' }}>Privacy Policy</h1>
        <p style={{ color: 'var(--light-text-color)', marginBottom: '2.5rem' }}>
          Last updated: April 13, 2026
        </p>

        <p style={{ marginBottom: '1.5rem' }}>
          Border Patrol is a free, open-source Chrome extension developed by SeaSav Labs Inc. This
          policy explains what data the extension accesses and how it is handled.
        </p>

        <h2 style={{ marginBottom: '0.75rem', marginTop: '2rem' }}>Data We Do Not Collect</h2>
        <p style={{ marginBottom: '1rem' }}>
          Border Patrol does <strong>not</strong>:
        </p>
        <ul style={{ paddingLeft: '1.5rem', marginBottom: '1.5rem', lineHeight: '1.8' }}>
          <li>Collect, transmit, or store any personal information</li>
          <li>Send any data to external servers or third parties</li>
          <li>Track your browsing history or the pages you visit</li>
          <li>Use analytics or advertising SDKs</li>
          <li>Require account registration of any kind</li>
        </ul>

        <h2 style={{ marginBottom: '0.75rem', marginTop: '2rem' }}>What the Extension Accesses</h2>
        <p style={{ marginBottom: '1rem' }}>
          To provide its visual debugging features, Border Patrol reads the DOM structure of the
          active tab. This is used solely to render outlines, margin/padding overlays, and the
          element inspector on your screen. This information is processed entirely within your
          browser and is never transmitted anywhere.
        </p>

        <h2 style={{ marginBottom: '0.75rem', marginTop: '2rem' }}>Local Storage</h2>
        <p style={{ marginBottom: '1rem' }}>
          The extension saves your preferences (such as border size, style, and feature state) to{' '}
          <code>chrome.storage.local</code> on your device. This data never leaves your browser and
          is only used to restore your settings between sessions.
        </p>

        <h2 style={{ marginBottom: '0.75rem', marginTop: '2rem' }}>Screenshots</h2>
        <p style={{ marginBottom: '1rem' }}>
          When you use the screenshot capture feature, the image is generated and downloaded directly
          to your device. No screenshot data is uploaded or shared.
        </p>

        <h2 style={{ marginBottom: '0.75rem', marginTop: '2rem' }}>Third-Party Services</h2>
        <p style={{ marginBottom: '1rem' }}>
          This landing page is hosted as a static site. It does not use cookies, tracking pixels, or
          third-party analytics.
        </p>

        <h2 style={{ marginBottom: '0.75rem', marginTop: '2rem' }}>Open Source</h2>
        <p style={{ marginBottom: '1rem' }}>
          Border Patrol is fully open source. You can inspect the complete source code at{' '}
          <a
            href="https://github.com/seasav/border-patrol"
            target="_blank"
            rel="noopener noreferrer"
          >
            github.com/seasav/border-patrol
          </a>
          .
        </p>

        <h2 style={{ marginBottom: '0.75rem', marginTop: '2rem' }}>Contact</h2>
        <p style={{ marginBottom: '1rem' }}>
          If you have questions about this policy, please open an issue on the{' '}
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
