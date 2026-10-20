import { Metadata } from 'next';
import { getCategories, getFeaturedOffers } from '@/lib/queries';

interface LayoutProps {
  children: React.ReactNode;
}

const SITE_URL = 'https://rafdeals.com';
const SITE_NAME = 'RafDeals';

// ============================================================
// GENERATE METADATA - FOR OFFERS LISTING PAGE
// ============================================================
export async function generateMetadata(): Promise<Metadata> {
  const categories = await getCategories('offers');
  const categoryNames = categories.map(c => c.name.toLowerCase()).join(', ');

  const featuredOffers = await getFeaturedOffers(6);
  const offerCount = featuredOffers.length;

  const title = `Verified Online Offers & Signup Bonuses`;
  const description = `Browse ${offerCount}+ hand-checked, verified online offers, signup bonuses, and exclusive deals. Manually audited promotions for maximum security.`;

  return {
    title,
    description,
    keywords: `online offers, exclusive deals, verified offers, signup bonuses, cashback offers, welcome offers, ${categoryNames}`,
    
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
      url: `${SITE_URL}/offers`,
      siteName: SITE_NAME,
      type: 'website',
      locale: 'en_US',
      images: [
        {
          url: '/img/og-default.jpg',
          width: 1254,
          height: 1254,
          alt: `${SITE_NAME} — Verified Online Offers & Exclusive Deals`,
        },
      ],
    },
    
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/img/og-default.jpg'],
      creator: '@rafdeals',
      site: '@rafdeals',
    },
    
    alternates: {
      canonical: `${SITE_URL}/offers`,
    },
    
    category: 'shopping',
    
    authors: [{ name: `${SITE_NAME} Team`, url: `${SITE_URL}/about` }],
    creator: SITE_NAME,
    publisher: SITE_NAME,
    metadataBase: new URL(SITE_URL),
  };
}

// ============================================================
// JSON-LD STRUCTURED DATA - FOR OFFERS LISTING
// ============================================================
async function OffersJsonLd() {
  const featuredOffers = await getFeaturedOffers(10);
  const categories = await getCategories('offers');

  const offerItems = featuredOffers.map((offer, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    url: `${SITE_URL}/offers/${offer.slug}`,
    name: offer.title,
  }));

  const categoryItems = categories.map((category, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: category.name,
    url: `${SITE_URL}/offers/category/${category.slug}`,
  }));

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${SITE_URL}#website`,
        url: SITE_URL,
        name: SITE_NAME,
        description: 'Discover verified online offers and exclusive deals on RafDeals.',
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
        '@id': `${SITE_URL}/offers#webpage`,
        url: `${SITE_URL}/offers`,
        name: `Verified Online Offers | ${SITE_NAME}`,
        description: 'Browse manually verified online offers, signup bonuses, and exclusive deals.',
        isPartOf: {
          '@id': `${SITE_URL}#website`,
        },
        inLanguage: 'en-US',
        dateModified: new Date().toISOString().split('T')[0],
        author: {
          '@type': 'Organization',
          name: `${SITE_NAME} Team`,
        },
        breadcrumb: {
          '@id': `${SITE_URL}/offers#breadcrumb`,
        },
        primaryImageOfPage: {
          '@type': 'ImageObject',
          url: `${SITE_URL}/img/og-default.jpg`,
          width: 1254,
          height: 1254,
        },
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${SITE_URL}/offers#breadcrumb`,
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: SITE_URL,
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'Offers',
            item: `${SITE_URL}/offers`,
          },
        ],
      },
      {
        '@type': 'CollectionPage',
        '@id': `${SITE_URL}/offers#collectionpage`,
        url: `${SITE_URL}/offers`,
        name: `Verified Online Offers | ${SITE_NAME}`,
        description: 'Browse manually verified online offers and signup bonuses.',
        isPartOf: {
          '@id': `${SITE_URL}#website`,
        },
        mainEntity: {
          '@type': 'ItemList',
          itemListElement: offerItems,
        },
      },
      {
        '@type': 'ItemList',
        name: 'Featured Verified Offers',
        description: 'Curated online offers and signup bonuses',
        itemListElement: offerItems,
        numberOfItems: offerItems.length,
      },
      {
        '@type': 'ItemList',
        name: 'Offer Categories',
        description: 'Browse online offers by category',
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
export default async function OffersLayout({ children }: LayoutProps) {
  const jsonLd = await OffersJsonLd();

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