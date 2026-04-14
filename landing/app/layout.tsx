import type { Metadata } from 'next';
import AntdProvider from '../components/AntdProvider';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://border-patrol.seasav.ca'),
  openGraph: {
    siteName: 'Border Patrol',
    type: 'website',
    images: [
      {
        url: '/assets/img/border-patrol-og-image.jpg',
        alt: 'Border Patrol CSS debugging extension screenshot',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
  },
  icons: {
    icon: { url: '/assets/img/border-patrol-logo.svg', type: 'image/svg+xml' },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang='en'>
      <head>
        <link
          rel='stylesheet'
          href='https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css'
          integrity='sha512-SnH5WK+bZxgPHs44uWIX+LLJAJ9/2PkPKZ5QiAj6Ta86w+fsb2TkcmfRyVX3pBnMFcV7oQPJkl9QevSCWr3W6A=='
          crossOrigin='anonymous'
          referrerPolicy='no-referrer'
        />
      </head>
      <body>
        <AntdProvider>{children}</AntdProvider>
      </body>
    </html>
  );
}
