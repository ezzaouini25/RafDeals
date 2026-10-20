import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { getOfferBySlug, getAllOfferSlugs } from '@/lib/queries';
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
  const offers = await getAllOfferSlugs();
  return offers.map((o) => ({ slug: o.slug }));
}

// ============================================================
// GENERATE METADATA
// ============================================================
export async function generateMetadata({ params }: LayoutProps): Promise<Metadata> {
  const { slug } = await params;
  const offer = await getOfferBySlug(slug);

  if (!offer) {
    return {
      title: 'Offer Not Found',
      description: 'The requested verified offer could not be found.',
    };
  }

  const title = offer.meta_title || `${offer.title} | ${SITE_NAME}`;
  const description = offer.meta_description || offer.description || `Discover ${offer.title} - a verified online offer. Read review details and terms before participating.`;
  const keywords = offer.meta_keywords || 'online offers, exclusive deals, verified offers, sign up bonuses';

  const coverImage = getAbsoluteImageUrl(offer.cover_image);

  return {
    title,
    description,
    keywords: keywords.split(',').map(k => k.trim()),
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/offers/${offer.slug}`,
      siteName: SITE_NAME,
      type: 'website',
      images: [
        {
          url: coverImage,
          width: 1254,
          height: 1254,
          alt: offer.title,
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
      canonical: `${SITE_URL}/offers/${offer.slug}`,
    },
  };
}

// ============================================================
// JSON-LD STRUCTURED DATA
// ============================================================
function OfferJsonLd({ offer }: { offer: Offer }) {
  const authorName = offer.author_name || `${SITE_NAME} Team`;
  const categoryName = offer.category?.name || null;
  const categorySlug = offer.category?.slug || null;
  
  const coverImage = getAbsoluteImageUrl(offer.cover_image);

  const aggregateRating = offer.rating ? {
    '@type': 'AggregateRating',
    ratingValue: offer.rating,
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

  const baseDate = offer.verified_date || offer.created_at;
  const priceValidUntil = baseDate ? new Date(new Date(baseDate).setFullYear(new Date(baseDate).getFullYear() + 1)).toISOString().split('T')[0] : undefined;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': `${SITE_URL}/offers/${offer.slug}#webpage`,
        url: `${SITE_URL}/offers/${offer.slug}`,
        name: offer.meta_title || offer.title,
        description: offer.meta_description || offer.description,
        isPartOf: {
          '@id': `${SITE_URL}#website`,
        },
        breadcrumb: {
          '@id': `${SITE_URL}/offers/${offer.slug}#breadcrumb`,
        },
        primaryImageOfPage: {
          '@type': 'ImageObject',
          url: coverImage,
          width: 1254,
          height: 1254,
        },
        about: category,
        datePublished: offer.created_at,
        dateModified: offer.updated_at || offer.created_at,
        author: author,
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${SITE_URL}/offers/${offer.slug}#breadcrumb`,
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
          ...(categoryName ? [{
            '@type': 'ListItem',
            position: 3,
            name: categoryName,
            item: `${SITE_URL}/offers/category/${categorySlug || ''}`,
          }] : []),
          {
            '@type': 'ListItem',
            position: categoryName ? 4 : 3,
            name: offer.title,
            item: `${SITE_URL}/offers/${offer.slug}`,
          },
        ],
      },
      {
        '@type': 'Product',
        name: offer.title,
        description: offer.meta_description || offer.description || offer.content?.substring(0, 200) || '',
        image: coverImage,
        url: `${SITE_URL}/offers/${offer.slug}`,
        ...(aggregateRating && { aggregateRating }),
        brand: {
          '@type': 'Organization',
          name: authorName,
        },
        offers: {
          '@type': 'Offer',
          url: offer.offer_link,
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
export default async function OfferDetailLayout({ children, params }: LayoutProps) {
  const { slug } = await params;
  const offer = await getOfferBySlug(slug);

  if (!offer) notFound();

  return (
    <>
      <OfferJsonLd offer={offer} />
      {children}
    </>
  );
}

// ============================================================
// REVALIDATE
// ============================================================
export const revalidate = 3600;