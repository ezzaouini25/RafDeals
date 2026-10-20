import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { getDealBySlug, getAllDealSlugs } from '@/lib/queries';
import type { Offer } from '@/types';

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}

const SITE_URL = 'https://rafdeals.com';
const SITE_NAME = 'RafDeals';

// ============================================================
// HELPER: Get absolute image URL
// ============================================================
function getAbsoluteImageUrl(path: string | null | undefined): string {
  if (!path) return `${SITE_URL}/img/og-default.jpg`;

  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  if (path.startsWith('/')) {
    return `${SITE_URL}${path}`;
  }

  return `${SITE_URL}/${path}`;
}

// ============================================================
// GENERATE STATIC PARAMS
// ============================================================
export async function generateStaticParams() {
  const deals = await getAllDealSlugs();
  return deals.map((d) => ({ slug: d.slug }));
}

// ============================================================
// GENERATE METADATA
// ============================================================
export async function generateMetadata({ params }: LayoutProps): Promise<Metadata> {
  const { slug } = await params;
  const deal = await getDealBySlug(slug);

  if (!deal) {
    return {
      title: 'Deal Not Found',
      description: 'The requested verified deal could not be found.',
    };
  }

  const title = deal.meta_title || `${deal.title} | ${SITE_NAME}`;
  const description = deal.meta_description || deal.description || `Discover ${deal.title} - a verified exclusive deal. Read review details and discounts before claiming.`;
  const keywords = deal.meta_keywords || 'exclusive deals, discounts, promo codes, verified deals, special offers';

  const coverImage = getAbsoluteImageUrl(deal.cover_image);

  return {
    title,
    description,
    keywords: keywords.split(',').map(k => k.trim()),
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/deals/${deal.slug}`,
      siteName: SITE_NAME,
      type: 'website',
      images: [
        {
          url: coverImage,
          width: 1254,
          height: 1254,
          alt: deal.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [coverImage],
      creator: '@rafdeals',
      site: '@rafdeals',
    },
    alternates: {
      canonical: `${SITE_URL}/deals/${deal.slug}`,
    },
  };
}

// ============================================================
// JSON-LD STRUCTURED DATA
// ============================================================
function DealJsonLd({ deal }: { deal: Offer }) {
  const authorName = deal.author_name || `${SITE_NAME} Team`;
  const categoryName = deal.category?.name || null;
  const categorySlug = deal.category?.slug || null;

  const coverImage = getAbsoluteImageUrl(deal.cover_image);

  const aggregateRating = deal.rating ? {
    '@type': 'AggregateRating',
    ratingValue: deal.rating,
    ratingCount: 10,
  } : undefined;

  const author = {
    '@type': 'Organization',
    name: authorName,
    url: SITE_URL,
  };

  const category = categoryName ? {
    '@type': 'Thing',
    name: categoryName,
  } : undefined;

  const baseDate = deal.verified_date || deal.created_at;
  const priceValidUntil = baseDate ? new Date(new Date(baseDate).setFullYear(new Date(baseDate).getFullYear() + 1)).toISOString().split('T')[0] : undefined;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': `${SITE_URL}/deals/${deal.slug}#webpage`,
        url: `${SITE_URL}/deals/${deal.slug}`,
        name: deal.meta_title || deal.title,
        description: deal.meta_description || deal.description,
        isPartOf: { '@id': `${SITE_URL}#website` },
        breadcrumb: { '@id': `${SITE_URL}/deals/${deal.slug}#breadcrumb` },
        primaryImageOfPage: {
          '@type': 'ImageObject',
          url: coverImage,
          width: 1254,
          height: 1254,
        },
        about: category,
        datePublished: deal.created_at,
        dateModified: deal.updated_at || deal.created_at,
        author: author,
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${SITE_URL}/deals/${deal.slug}#breadcrumb`,
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: 'Deals', item: `${SITE_URL}/deals` },
          ...(categoryName ? [{
            '@type': 'ListItem',
            position: 3,
            name: categoryName,
            item: `${SITE_URL}/deals/category/${categorySlug || ''}`,
          }] : []),
          {
            '@type': 'ListItem',
            position: categoryName ? 4 : 3,
            name: deal.title,
            item: `${SITE_URL}/deals/${deal.slug}`,
          },
        ],
      },
      {
        '@type': 'Product',
        name: deal.title,
        description: deal.meta_description || deal.description || deal.content?.substring(0, 200) || '',
        image: coverImage,
        url: `${SITE_URL}/deals/${deal.slug}`,
        ...(aggregateRating && { aggregateRating }),
        brand: {
          '@type': 'Organization',
          name: authorName,
        },
        offers: {
          '@type': 'Offer',
          url: deal.offer_link,
          priceCurrency: 'USD',
          availability: 'https://schema.org/InStock',
          ...(priceValidUntil && { priceValidUntil }),
        },
        ...(category && { category }),
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
export default async function DealDetailLayout({ children, params }: LayoutProps) {
  const { slug } = await params;
  const deal = await getDealBySlug(slug);

  if (!deal) notFound();

  return (
    <>
      <DealJsonLd deal={deal} />
      {children}
    </>
  );
}

// ============================================================
// REVALIDATE
// ============================================================
export const revalidate = 3600;