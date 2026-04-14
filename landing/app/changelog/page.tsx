import type { Metadata } from 'next';
import { readFileSync } from 'fs';
import { join } from 'path';
import { marked, Renderer } from 'marked';
import Nav from '../../components/Nav';
import Footer from '../../components/Footer';

// Strip raw HTML blocks from the markdown output to prevent XSS
const renderer = new Renderer();
renderer.html = () => '';
marked.use({ renderer });

export const metadata: Metadata = {
  title: 'Border Patrol - Changelog',
  description:
    "View the changelog for Border Patrol - See what's new, what's changed, and what's been fixed in each version.",
  alternates: { canonical: 'https://border-patrol.seasav.ca/changelog/' },
  openGraph: {
    url: 'https://border-patrol.seasav.ca/changelog/',
    title: 'Border Patrol - Changelog',
    description:
      'Stay updated with the latest changes to the Border Patrol Chrome extension. View version history and updates.',
  },
  twitter: {
    title: 'Border Patrol - Changelog',
    description:
      'Stay updated with the latest changes to the Border Patrol Chrome extension. View version history and updates.',
  },
};

export default function ChangelogPage() {
  // process.cwd() resolves to landing/ during `next build`; CHANGELOG.md is one level up at the repo root
  const changelogPath = join(process.cwd(), '..', 'CHANGELOG.md');
  const markdown = readFileSync(changelogPath, 'utf-8');
  const changelogHtml = marked.parse(markdown) as string;

  return (
    <>
      <Nav />

      <div style={{ borderBottom: '1px solid var(--border-color)', background: 'var(--card-background)' }}>
        <div className="container" style={{ paddingTop: '3rem', paddingBottom: '3rem' }}>
          <p style={{ fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--bp-blue-500)', marginBottom: '0.75rem' }}>
            Release History
          </p>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Changelog</h1>
          <p style={{ color: 'var(--light-text-color)', marginBottom: 0 }}>
            All notable changes to Border Patrol, most recent first.
          </p>
        </div>
      </div>

      <main className="container" style={{ paddingTop: '2.5rem', paddingBottom: '5rem' }}>
        <div className="changelog-content" dangerouslySetInnerHTML={{ __html: changelogHtml }} />
      </main>

      <Footer />
    </>
  );
}
