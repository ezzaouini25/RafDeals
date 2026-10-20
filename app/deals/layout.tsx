import { Metadata } from 'next';
import { getCategories, getFeaturedDeals } from '@/lib/queries';

interface LayoutProps {
  children: React.ReactNode;
}

const SITE_URL = 'https://rafdeals.com';
const SITE_NAME = 'RafDeals';

// ============================================================
// GENERATE METADATA - FOR DEALS LISTING PAGE
// ============================================================
export async function generateMetadata(): Promise<Metadata> {
  const categories = await getCategories('deals');
  const categoryNames = categories.map(c => c.name.toLowerCase()).join(', ');

  const featuredDeals = await getFeaturedDeals(6);
  const dealCount = featuredDeals.length;

  const title = `Exclusive Deals & Discounts`;
  const description = `Browse ${dealCount}+ hand-checked, verified exclusive deals, discounts, and promo codes from trusted brands. Manually audited promotions for maximum savings.`;

  return {
    title,
    description,
    keywords: `exclusive deals, discounts, promo codes, verified deals, special offers, coupons, ${categoryNames}`,

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

    openGraph: {
      title,
      description,
      url: `${SITE_URL}/deals`,
      siteName: SITE_NAME,
      type: 'website',
      locale: 'en_US',
      images: [
        {
          url: `${SITE_URL}/img/og-default.jpg`,
          width: 1254,
          height: 1254,
          alt: `${SITE_NAME} — Verified Exclusive Deals & Discounts`,
        },
      ],
    },

    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`${SITE_URL}/img/og-default.jpg`],
      creator: '@rafdeals',
      site: '@rafdeals',
    },

    alternates: {
      canonical: `${SITE_URL}/deals`,
    },

    category: 'shopping',

    authors: [{ name: `${SITE_NAME} Team`, url: `${SITE_URL}/about` }],
    creator: SITE_NAME,
    publisher: SITE_NAME,
    metadataBase: new URL(SITE_URL),
  };
}

// ============================================================
// JSON-LD STRUCTURED DATA - FOR DEALS LISTING
// ============================================================
async function DealsJsonLd() {
  const featuredDeals = await getFeaturedDeals(10);
  const categories = await getCategories('deals');

  const dealItems = featuredDeals.map((deal, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    url: `${SITE_URL}/deals/${deal.slug}`,
    name: deal.title,
  }));

  const categoryItems = categories.map((category, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: category.name,
    url: `${SITE_URL}/deals/category/${category.slug}`,
  }));

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${SITE_URL}#website`,
        url: SITE_URL,
        name: SITE_NAME,
        description: 'Discover verified exclusive deals, discounts, and promotions on RafDeals.',
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
        '@type': 'WebPage',
        '@id': `${SITE_URL}/deals#webpage`,
        url: `${SITE_URL}/deals`,
        name: `Exclusive Deals & Discounts | ${SITE_NAME}`,
        description: 'Browse manually verified exclusive deals and discounts from trusted brands.',
        isPartOf: { '@id': `${SITE_URL}#website` },
        inLanguage: 'en-US',
        about: { '@type': 'Thing', name: 'Exclusive Deals and Discounts' },
        dateModified: new Date().toISOString().split('T')[0],
        author: { '@type': 'Organization', name: `${SITE_NAME} Team` },
        breadcrumb: { '@id': `${SITE_URL}/deals#breadcrumb` },
        primaryImageOfPage: {
          '@type': 'ImageObject',
          url: `${SITE_URL}/img/og-default.jpg`,
          width: 1254,
          height: 1254,
        },
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${SITE_URL}/deals#breadcrumb`,
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: 'Deals', item: `${SITE_URL}/deals` },
        ],
      },
      {
        '@type': 'CollectionPage',
        '@id': `${SITE_URL}/deals#collectionpage`,
        url: `${SITE_URL}/deals`,
        name: `Exclusive Deals & Discounts | ${SITE_NAME}`,
        description: 'Browse manually verified exclusive deals and discounts.',
        isPartOf: { '@id': `${SITE_URL}#website` },
        about: { '@type': 'Thing', name: 'Exclusive Deals and Discounts' },
        mainEntity: {
          '@type': 'ItemList',
          itemListElement: dealItems,
        },
      },
      {
        '@type': 'ItemList',
        name: 'Featured Exclusive Deals',
        description: 'Curated exclusive deals and discounts',
        itemListElement: dealItems,
        numberOfItems: dealItems.length,
      },
      {
        '@type': 'ItemList',
        name: 'Deal Categories',
        description: 'Browse exclusive deals by category',
        itemListElement: categoryItems,
        numberOfItems: categoryItems.length,
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
        },
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
        },
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
// LAYOUT COMPONENT
// ============================================================
export default async function DealsLayout({ children }: LayoutProps) {
  const jsonLd = await DealsJsonLd();

  return (
    <>
      {jsonLd}
      {children}
    </>
  );
}

// ============================================================
// REVALIDATE - Every hour
// ============================================================
export const revalidate = 3600;