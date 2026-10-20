import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getLegalPageBySlug } from '@/lib/queries';

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}

const SITE_URL = 'https://rafdeals.com';
const SITE_NAME = 'RafDeals';

export async function generateMetadata({ params }: LayoutProps): Promise<Metadata> {
  const { slug } = await params;
  const page = await getLegalPageBySlug(slug);
  
  if (!page) {
    return {
      title: 'Page Not Found',
      description: 'The requested legal or policy page could not be found.',
    };
  }

  const title = page.meta_title || page.title;
  const description = page.meta_description || `${page.title} for ${SITE_NAME}. Read our terms, conditions, and privacy disclosures.`;

  return {
    title,
    description,
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
      title: `${title} | ${SITE_NAME}`,
      description,
      url: `${SITE_URL}/legal/${slug}`,
      siteName: SITE_NAME,
      type: 'website',
      images: [
        {
          url: `${SITE_URL}/img/og-default.jpg`,
          width: 1254,
          height: 1254,
          alt: `${page.title} — ${SITE_NAME}`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | ${SITE_NAME}`,
      description,
      images: [`${SITE_URL}/img/og-default.jpg`],
      creator: '@rafdeals',
      site: '@rafdeals',
    },
    alternates: {
      canonical: `${SITE_URL}/legal/${slug}`,
    },
  };
}

export default async function LegalLayout({ children, params }: LayoutProps) {
  const { slug } = await params;
  const page = await getLegalPageBySlug(slug);
  if (!page) notFound();

  const legalSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: page.title,
    description: page.meta_description || page.title,
    url: `${SITE_URL}/legal/${slug}`,
    isPartOf: {
      '@id': `${SITE_URL}#website`,
    },
  };

  const escapedJsonLd = JSON.stringify(legalSchema).replace(/</g, '\\u003c');

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: escapedJsonLd }}
      />
      <div className="legal-section-wrapper min-h-[70vh] bg-gray-50 py-10 px-4 sm:px-6 lg:px-8" id="legal-section-wrapper">
        <div className="max-w-4xl mx-auto bg-white p-6 sm:p-10 shadow-sm border border-gray-100 rounded-none">
          {children}
        </div>
      </div>
    </>
  );
}

// ============================================================
// REVALIDATE - Every hour
// ============================================================
export const revalidate = 3600;