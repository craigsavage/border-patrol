import Link from 'next/link';

export default function Footer() {
  return (
    <footer>
      <div className="container">
        <p>
          &copy; 2026 Border Patrol. Developed by SeaSav Labs Inc.{' '}
          <Link href="/changelog/">Changelog</Link>
          {' · '}
          <Link href="/privacy/">Privacy Policy</Link>
          {' · '}
          <Link href="/terms/">Terms of Use</Link>
        </p>
      </div>
    </footer>
  );
}
