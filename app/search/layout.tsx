import type { Metadata } from 'next';

const SITE_URL = 'https://rafdeals.com';
const SITE_NAME = 'RafDeals';

export const metadata: Metadata = {
  title: 'Search Verified Offers & Deals | RafDeals',
  description: 'Search our curated database of manually verified online offers, signup bonuses, and exclusive deals.',
  robots: {
    index: false, // Recommended for search result pages to prevent duplicate index bloat
    follow: true,
  },
};

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  const searchSchema = {
    '@context': 'https://schema.org',
    '@type': 'SearchResultsPage',
    name: `Search ${SITE_NAME}`,
    description: 'Search manually verified online offers and exclusive deals.',
    url: `${SITE_URL}/search`,
  };

  const escapedJsonLd = JSON.stringify(searchSchema).replace(/</g, '\\u003c');

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: escapedJsonLd }}
      />
      <div className="search-section-wrapper min-h-[70vh] bg-white py-8 px-4 sm:px-6 lg:px-8" id="search-section-wrapper">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </div>
    </>
  );
}