import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { getCategoryBySlug, getCategories } from '@/lib/queries';

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ categorySlug: string }>;
}

const SITE_URL = 'https://rafdeals.com';
const SITE_NAME = 'RafDeals';

// ============================================================
// GENERATE STATIC PARAMS
// ============================================================
export async function generateStaticParams() {
  const categories = await getCategories('offers');
  return categories.map((cat) => ({
    categorySlug: cat.slug,
  }));
}

// ============================================================
// GENERATE METADATA - WITH CATEGORY NAME FROM DATABASE
// ============================================================
export async function generateMetadata({ params }: LayoutProps): Promise<Metadata> {
  const { categorySlug } = await params;
  const category = await getCategoryBySlug(categorySlug);

  if (!category) {
    return {
      title: 'Category Not Found',
      description: 'The requested category could not be found.',
    };
  }

  const categoryName = category.name;
  const title = `${categoryName} Offers & Deals`;
  const description = `Browse our curated collection of verified ${categoryName.toLowerCase()} online offers and exclusive deals. Manually audited promotions for maximum security.`;

  return {
    title,
    description,
    keywords: `${categoryName.toLowerCase()}, online offers, exclusive deals, verified offers, signup bonuses, cashback offers`,
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/offers/category/${categorySlug}`,
      siteName: SITE_NAME,
      type: 'website',
      images: [
        {
          url: `${SITE_URL}/img/og-default.jpg`,
          width: 1254,
          height: 1254,
          alt: `${categoryName} — ${SITE_NAME}`,
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
      canonical: `${SITE_URL}/offers/category/${categorySlug}`,
    },
  };
}

// ============================================================
// LAYOUT COMPONENT
// ============================================================
export default async function OffersCategoryLayout({ children, params }: LayoutProps) {
  const { categorySlug } = await params;
  const category = await getCategoryBySlug(categorySlug);

  if (!category) notFound();

  return <>{children}</>;
}

// ============================================================
// REVALIDATE
// ============================================================
export const revalidate = 3600;