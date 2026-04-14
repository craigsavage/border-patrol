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

export default function TermsPage() {
  return (
    <>
      <Nav />
      <main className="container" style={{ paddingTop: '3rem', paddingBottom: '4rem', maxWidth: '760px' }}>
        <h1 style={{ marginBottom: '0.5rem' }}>Terms of Use</h1>
        <p style={{ color: 'var(--light-text-color)', marginBottom: '2.5rem' }}>
          Last updated: April 13, 2026
        </p>

        <p style={{ marginBottom: '1.5rem' }}>
          By installing or using the Border Patrol Chrome extension (&ldquo;the Extension&rdquo;),
          you agree to the following terms. The Extension is developed and maintained by SeaSav Labs
          Inc. (&ldquo;we&rdquo;, &ldquo;us&rdquo;).
        </p>

        <h2 style={{ marginBottom: '0.75rem', marginTop: '2rem' }}>License</h2>
        <p style={{ marginBottom: '1rem' }}>
          Border Patrol is open-source software released under the{' '}
          <a
            href="https://github.com/seasav/border-patrol/blob/main/LICENSE"
            target="_blank"
            rel="noopener noreferrer"
          >
            MIT License
          </a>
          . You are free to use, copy, modify, and distribute it in accordance with the terms of
          that license.
        </p>

        <h2 style={{ marginBottom: '0.75rem', marginTop: '2rem' }}>Intended Use</h2>
        <p style={{ marginBottom: '1rem' }}>
          The Extension is a developer tool intended to assist with CSS layout debugging and
          inspection. It is provided for lawful, personal or professional development use only. You
          agree not to use the Extension for any purpose that violates applicable laws or the terms
          of any third-party service.
        </p>

        <h2 style={{ marginBottom: '0.75rem', marginTop: '2rem' }}>No Warranty</h2>
        <p style={{ marginBottom: '1rem' }}>
          The Extension is provided &ldquo;as is&rdquo;, without warranty of any kind, express or
          implied. We make no guarantees regarding availability, accuracy, or fitness for a
          particular purpose. Use at your own risk.
        </p>

        <h2 style={{ marginBottom: '0.75rem', marginTop: '2rem' }}>Limitation of Liability</h2>
        <p style={{ marginBottom: '1rem' }}>
          To the fullest extent permitted by law, SeaSav Labs Inc. shall not be liable for any
          direct, indirect, incidental, or consequential damages arising from your use of or
          inability to use the Extension.
        </p>

        <h2 style={{ marginBottom: '0.75rem', marginTop: '2rem' }}>Changes</h2>
        <p style={{ marginBottom: '1rem' }}>
          We may update these terms from time to time. Continued use of the Extension after changes
          are posted constitutes acceptance of the revised terms. The &ldquo;last updated&rdquo;
          date at the top of this page will reflect any changes.
        </p>

        <h2 style={{ marginBottom: '0.75rem', marginTop: '2rem' }}>Contact</h2>
        <p style={{ marginBottom: '1rem' }}>
          Questions about these terms can be directed to the{' '}
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
