import { Metadata } from 'next';
import { getCategories, getLatestArticles } from '@/lib/queries';

interface LayoutProps {
  children: React.ReactNode;
}

const SITE_URL = 'https://rafdeals.com';
const SITE_NAME = 'RafDeals';

// ============================================================
// GENERATE METADATA - FOR BLOG LISTING PAGE
// ============================================================
export async function generateMetadata(): Promise<Metadata> {
  const categories = await getCategories('articles');
  const categoryNames = categories.map(c => c.name.toLowerCase()).join(', ');

  const latestArticles = await getLatestArticles(6);
  const articleCount = latestArticles.length;

  const title = `Blog & Expert Guides`;
  const description = `Discover ${articleCount}+ expert guides, tips, and strategies for online offers, exclusive deals, and maximizing rewards securely.`;

  return {
    title,
    description,
    keywords: `online offers guides, exclusive deals tips, verified offers blog, signup bonuses strategies, ${categoryNames}`,
    
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
      url: `${SITE_URL}/blog`,
      siteName: SITE_NAME,
      type: 'website',
      locale: 'en_US',
      images: [
        {
          url: `${SITE_URL}/img/og-default.jpg`,
          width: 1254,
          height: 1254,
          alt: `${SITE_NAME} — Expert Blog & Guides`,
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
      canonical: `${SITE_URL}/blog`,
    },
    
    category: 'shopping',
    
    authors: [{ name: `${SITE_NAME} Team`, url: `${SITE_URL}/about` }],
    creator: SITE_NAME,
    publisher: SITE_NAME,
    metadataBase: new URL(SITE_URL),
  };
}

// ============================================================
// JSON-LD STRUCTURED DATA - FOR BLOG LISTING
// ============================================================
async function BlogJsonLd() {
  const latestArticles = await getLatestArticles(10);
  const categories = await getCategories('articles');

  const articleItems = latestArticles.map((article, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    url: `${SITE_URL}/blog/${article.slug}`,
    name: article.title,
  }));

  const categoryItems = categories.map((category, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: category.name,
    url: `${SITE_URL}/blog/category/${category.slug}`,
  }));

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${SITE_URL}#website`,
        url: SITE_URL,
        name: SITE_NAME,
        description: 'Discover expert guides, proven strategies, and verified online offers on RafDeals.',
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
        '@id': `${SITE_URL}/blog#webpage`,
        url: `${SITE_URL}/blog`,
        name: `Blog & Expert Guides | ${SITE_NAME}`,
        description: 'Discover proven strategies, expert tips, and legitimate online offers and deals.',
        isPartOf: {
          '@id': `${SITE_URL}#website`,
        },
        inLanguage: 'en-US',
        about: {
          '@type': 'Thing',
          name: 'Online Offers and Deals',
        },
        dateModified: new Date().toISOString().split('T')[0],
        author: {
          '@type': 'Organization',
          name: `${SITE_NAME} Team`,
        },
        breadcrumb: {
          '@id': `${SITE_URL}/blog#breadcrumb`,
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
        '@id': `${SITE_URL}/blog#breadcrumb`,
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
            name: 'Blog',
            item: `${SITE_URL}/blog`,
          },
        ],
      },
      {
        '@type': 'CollectionPage',
        '@id': `${SITE_URL}/blog#collectionpage`,
        url: `${SITE_URL}/blog`,
        name: `Blog & Expert Guides | ${SITE_NAME}`,
        description: 'Discover expert tips and guides on online offers and exclusive deals.',
        isPartOf: {
          '@id': `${SITE_URL}#website`,
        },
        about: {
          '@type': 'Thing',
          name: 'Online Offers and Deals',
        },
        mainEntity: {
          '@type': 'ItemList',
          itemListElement: articleItems,
        },
      },
      {
        '@type': 'ItemList',
        name: 'Latest Articles & Guides',
        description: 'Recent articles about verified online offers and deals',
        itemListElement: articleItems,
        numberOfItems: articleItems.length,
      },
      {
        '@type': 'ItemList',
        name: 'Blog Categories',
        description: 'Browse articles by category',
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
export default async function BlogLayout({ children }: LayoutProps) {
  const jsonLd = await BlogJsonLd();

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