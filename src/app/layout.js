import { Source_Sans_3, Source_Serif_4 } from 'next/font/google';
import './globals.css';

const sans = Source_Sans_3({ subsets: ['latin'], variable: '--font-sans', display: 'swap' });
const serif = Source_Serif_4({ subsets: ['latin'], variable: '--font-serif', display: 'swap' });

const siteUrl = process.env.APP_URL || 'http://localhost:3000';

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Embassy of the Republic of Higeria – Washington, D.C. (Demonstration Portal)',
    template: '%s | Embassy of Higeria, Washington, D.C. (Demo)',
  },
  description:
    'Demonstration digital services portal for the Embassy of the Republic of Higeria in Washington, D.C.: passport and visa applications, consular services, news and contact information.',
  openGraph: {
    type: 'website',
    siteName: 'Embassy of the Republic of Higeria – Washington, D.C. (Demo)',
    locale: 'en_US',
  },
  robots: { index: false, follow: false }, // demonstration site: do not index until officially approved
};

export const viewport = { themeColor: '#0e5c58', width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${sans.variable} ${serif.variable}`}>
      <body className="flex min-h-screen flex-col">
        <a
          href="#main"
          className="sr-only z-50 bg-white px-4 py-2 font-semibold text-primary-800 focus:not-sr-only focus:absolute focus:left-2 focus:top-2"
        >
          Skip to main content
        </a>
        {children}
      </body>
    </html>
  );
}
