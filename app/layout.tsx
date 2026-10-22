import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import LayoutWrapper from '@/components/LayoutWrapper';
import HeaderScripts from '@/components/HeaderScripts';
import PopupAd from '@/components/ui/PopupAd';
import { GoogleAnalytics } from '@next/third-parties/google';
import CookieConsent from '@/components/ui/CookieConsent';
import {
  getCategories,
  getFeaturedOffers,
  getFeaturedDeals,
  getLatestArticles,
  getHomepageCounters,
} from '@/lib/queries';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Analytics } from '@vercel/analytics/react';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  preload: true,
  variable: '--font-inter',
});

// ============================================================
// CONFIGURATION CONSTANTS
// ============================================================
const SITE_URL = 'https://rafdeals.com';
const SITE_NAME = 'RafDeals';
const DEFAULT_TITLE = 'RafDeals | Verified Online Offers & Exclusive Deals';
const DEFAULT_DESCRIPTION =
  'Discover verified online offers, signup bonuses, cashback opportunities, and exclusive deals on RafDeals. Review offer details and terms before participating.';

// ============================================================
// VIEWPORT
// ============================================================
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#0f0e47',
  colorScheme: 'light',
};

// ============================================================
// METADATA
// ============================================================
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

// ============================================================
// JSON-LD STRUCTURED DATA (Reuses pre-fetched categories)
// ============================================================
async function HomepageJsonLd({ categories }: { categories: any[] }) {
  const [featuredOffers, featuredDeals, latestArticles, counters] =
    await Promise.all([
      getFeaturedOffers(6),
      getFeaturedDeals(6),
      getLatestArticles(6),
      getHomepageCounters(),
    ]);

  const offerItems = (featuredOffers || []).map((offer, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    url: `${SITE_URL}/offers/${offer.slug}`,
    name: offer.title,
  }));

  const dealItems = (featuredDeals || []).map((deal, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    url: `${SITE_URL}/deals/${deal.slug}`,
    name: deal.title,
  }));

  const articleItems = (latestArticles || []).map((article, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    url: `${SITE_URL}/blog/${article.slug}`,
    name: article.title,
  }));

  const categoryItems = (categories || []).map((category, index) => {
    let basePath = 'blog';
    if (category.type === 'offers') basePath = 'offers';
    else if (category.type === 'deals') basePath = 'deals';

    return {
      '@type': 'ListItem',
      position: index + 1,
      name: category.name,
      url: `${SITE_URL}/${basePath}/category/${category.slug}`,
    };
  });

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${SITE_URL}#website`,
        url: SITE_URL,
        name: SITE_NAME,
        description: DEFAULT_DESCRIPTION,
        inLanguage: 'en-US',
        potentialAction: {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
          },
          'query-input': 'required name=search_term_string',
        },
      },
      {
        '@type': 'Organization',
        '@id': `${SITE_URL}#organization`,
        name: SITE_NAME,
        url: SITE_URL,
        logo: {
          '@type': 'ImageObject',
          url: `${SITE_URL}/img/logo.png`,
          width: 512,
          height: 512,
          caption: `${SITE_NAME} Logo`,
        },
        description: `${SITE_NAME} is a curated platform connecting users with verified online offers and exclusive deals from trusted brands.`,
        email: 'support@rafdeals.com',
        foundingDate: '2026',
        sameAs: [
          'https://twitter.com/rafdeals',
          'https://facebook.com/rafdeals',
          'https://instagram.com/rafdeals',
        ],
        contactPoint: {
          '@type': 'ContactPoint',
          email: 'support@rafdeals.com',
          contactType: 'customer service',
          availableLanguage: ['English'],
          url: `${SITE_URL}/contact`,
        },
      },
      {
        '@type': 'WebPage',
        '@id': `${SITE_URL}#webpage`,
        url: SITE_URL,
        name: DEFAULT_TITLE,
        description: DEFAULT_DESCRIPTION,
        isPartOf: { '@id': `${SITE_URL}#website` },
        inLanguage: 'en-US',
        breadcrumb: { '@id': `${SITE_URL}#breadcrumb` },
        primaryImageOfPage: {
          '@type': 'ImageObject',
          url: `${SITE_URL}/img/og-default.jpg`,
          width: 1254,
          height: 1254,
        },
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${SITE_URL}#breadcrumb`,
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
        ],
      },
      {
        '@type': 'ItemList',
        name: 'Featured Verified Offers',
        url: `${SITE_URL}/offers`,
        itemListElement: offerItems,
        numberOfItems: offerItems.length,
      },
      {
        '@type': 'ItemList',
        name: 'Featured Exclusive Deals',
        url: `${SITE_URL}/deals`,
        itemListElement: dealItems,
        numberOfItems: dealItems.length,
      },
      {
        '@type': 'ItemList',
        name: 'Latest Deals & Offers Articles',
        url: `${SITE_URL}/blog`,
        itemListElement: articleItems,
        numberOfItems: articleItems.length,
      },
      {
        '@type': 'ItemList',
        name: 'Offers & Deals Categories',
        itemListElement: categoryItems,
        numberOfItems: categoryItems.length,
      },
    ],
  };

  const escapedJsonLd = JSON.stringify(jsonLd).replace(/</g, '\\u003c');

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: escapedJsonLd }}
    />
  );
}

// ============================================================
// ROOT LAYOUT
// ============================================================
export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Fetch categories once for both layout wrapping and JSON-LD generation
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

  const jsonLdComponent = await HomepageJsonLd({ categories: allCategories });

  const preconnectLinks = ['https://images.unsplash.com'];

  return (
    <html lang="en" className={inter.variable}>
      <head>
        {preconnectLinks.map((url) => (
          <link key={url} rel="preconnect" href={url} crossOrigin="anonymous" />
        ))}

        <HeaderScripts placement="head_open" />
        {jsonLdComponent}
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
        {/* ✅ Google Analytics - Add this here */}
        <GoogleAnalytics gaId="G-3X5GSFFH9Q" />
        <HeaderScripts placement="body_close" />
      </body>
    </html>
  );
}

// ============================================================
// REVALIDATE
// ============================================================
export const revalidate = 3600;