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
  const categories = await getCategories('deals');
  return categories.map((cat) => ({
    categorySlug: cat.slug,
  }));
}

// ============================================================
// GENERATE METADATA
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
  const title = `${categoryName} Exclusive Deals & Discounts`;
  const description = `Browse our curated collection of verified ${categoryName.toLowerCase()} exclusive deals and discounts. Manually audited promotions for maximum savings.`;

  return {
    title,
    description,
    keywords: `${categoryName.toLowerCase()}, exclusive deals, discounts, promo codes, verified deals, special offers`,
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/deals/category/${categorySlug}`,
      siteName: SITE_NAME,
      type: 'website',
      images: [
        {
          url: `${SITE_URL}/img/og-default.jpg`,
          width: 1254,
          height: 1254,
          alt: `${categoryName} Deals — ${SITE_NAME}`,
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
      canonical: `${SITE_URL}/deals/category/${categorySlug}`,
    },
  };
}

// ============================================================
// LAYOUT COMPONENT
// ============================================================
export default async function DealsCategoryLayout({ children, params }: LayoutProps) {
  const { categorySlug } = await params;
  const category = await getCategoryBySlug(categorySlug);

  if (!category) notFound();

  return <>{children}</>;
}

// ============================================================
// REVALIDATE
// ============================================================
export const revalidate = 3600;