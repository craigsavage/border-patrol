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
      <main className="container" style={{ paddingTop: '2rem' }}>
        <div dangerouslySetInnerHTML={{ __html: changelogHtml }} />
      </main>
      <Footer />
    </>
  );
}
