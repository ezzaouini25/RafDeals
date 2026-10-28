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
// GENERATE METADATA
// ============================================================
export async function generateMetadata({ params }: LayoutProps): Promise<Metadata> {
  const { categorySlug } = await params;
  const category = await getCategoryBySlug(categorySlug, 'offers');

  if (!category) {
    return {
      title: 'Category Not Found',
      description: 'The requested category could not be found.',
    };
  }

  const categoryName = category.name;
  const title = `${categoryName} Offers & Opportunities`;
  const description = `Browse our curated collection of verified ${categoryName.toLowerCase()} offers and money-making opportunities. Manually verified for maximum value.`;

  return {
    title,
    description,
    keywords: `${categoryName.toLowerCase()}, online offers, money making, verified offers, exclusive deals`,
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
          alt: `${categoryName} Offers — ${SITE_NAME}`,
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
  const category = await getCategoryBySlug(categorySlug, 'offers');

  if (!category) notFound();

  return <>{children}</>;
}

// ============================================================
// REVALIDATE
// ============================================================
export const revalidate = 3600;