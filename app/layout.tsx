import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import LayoutWrapper from '@/components/LayoutWrapper';
import HeaderScripts from '@/components/HeaderScripts';
import PopupAd from '@/components/ui/PopupAd';
import { GoogleAnalytics } from '@next/third-parties/google';
import CookieConsent from '@/components/ui/CookieConsent';
import { getCategories } from '@/lib/queries';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Analytics } from '@vercel/analytics/react';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  preload: true,
  variable: '--font-inter',
});

const SITE_URL = 'https://rafdeals.com';
const SITE_NAME = 'RafDeals';
const DEFAULT_TITLE = 'RafDeals | Verified Online Offers & Exclusive Deals';
const DEFAULT_DESCRIPTION =
  'Discover valuable online offers, special deals, and promotions across a broad selection of categories at RafDeals.';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#0f0e47',
  colorScheme: 'light',
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: DEFAULT_TITLE,
    template: `%s | ${SITE_NAME}`,
  },
  description: DEFAULT_DESCRIPTION,
  keywords: [
    'online offers',
    'exclusive deals',
    'verified offers',
    'sign up bonuses',
    'cashback offers',
    'welcome offers',
    'best online deals',
    'RafDeals',
  ],
  applicationName: SITE_NAME,
  category: 'shopping',
  authors: [{ name: `${SITE_NAME} Team`, url: `${SITE_URL}/about` }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  referrer: 'origin-when-cross-origin',
  formatDetection: {
    email: true,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: SITE_URL,
    siteName: SITE_NAME,
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    images: [
      {
        url: '/img/og-default.jpg',
        width: 1254,
        height: 1254,
        alt: `${SITE_NAME} — Verified online offers and exclusive deals`,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    images: ['/img/og-default.jpg'],
    creator: '@rafdeals',
    site: '@rafdeals',
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: '/img/favicons/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/img/favicons/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/img/favicons/favicon-48x48.png', sizes: '48x48', type: 'image/png' },
      { url: '/img/favicons/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/img/favicons/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    shortcut: '/img/favicons/favicon.ico',
    apple: [
      { url: '/img/favicons/apple-touch-icon-180x180.png', sizes: '180x180', type: 'image/png' },
    ],
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const allCategories = await getCategories();

  const offerCategories = allCategories.filter(
    (c: any) => c.type === 'offers' || c.type === 'both'
  );
  const articleCategories = allCategories.filter(
    (c: any) => c.type === 'articles' || c.type === 'both'
  );
  const dealCategories = allCategories.filter(
    (c: any) => c.type === 'deals' || c.type === 'both'
  );

  const preconnectLinks = ['https://images.unsplash.com'];

  return (
    <html lang="en" className={inter.variable}>
      <head>
        {preconnectLinks.map((url) => (
          <link key={url} rel="preconnect" href={url} crossOrigin="anonymous" />
        ))}

        <HeaderScripts placement="head_open" />
        <HeaderScripts placement="head_close" />
      </head>
      <body
        className={`${inter.className} bg-white text-navy font-sans antialiased`}
        suppressHydrationWarning
      >
        <HeaderScripts placement="body_open" />

        <LayoutWrapper
          offerCategories={offerCategories}
          articleCategories={articleCategories}
          dealCategories={dealCategories}
        >
          {children}
        </LayoutWrapper>

        <PopupAd />
        <CookieConsent />

        <SpeedInsights />
        <Analytics />
        <GoogleAnalytics gaId="G-3X5GSFFH9Q" />
        <HeaderScripts placement="body_close" />
      </body>
    </html>
  );
}

export const revalidate = 3600;