import Hero from '@/components/sections/Hero';
import FeaturedOffers from '@/components/sections/FeaturedOffers';
import FeaturedDeals from '@/components/sections/FeaturedDeals';
import HowItWorks from '@/components/sections/HowItWorks';
import AboutUs from '@/components/sections/AboutUs';
import LatestBlog from '@/components/sections/LatestBlog';
import StatsSection from '@/components/sections/StatsSection';
import Testimonials from '@/components/sections/Testimonials';
import FAQSection from '@/components/sections/FAQSection';
import CTABanner from '@/components/sections/CTABanner';
import AdPlacement from '@/components/ui/AdPlacement';
import AdSense from '@/components/ui/GoogleAdSense';
import {
  getLatestArticles,
  getFeaturedOffers,
  getFeaturedDeals,
  getCategories,
} from '@/lib/queries';

export const revalidate = 3600;

const SITE_URL = 'https://rafdeals.com';
const SITE_NAME = 'RafDeals';
const DEFAULT_TITLE = 'RafDeals | Verified Online Offers & Exclusive Deals';
const DEFAULT_DESCRIPTION =
  'Discover verified online offers, signup bonuses, cashback opportunities, and exclusive deals on RafDeals. Review offer details and terms before participating.';

async function HomepageJsonLd() {
  const [categories, featuredOffers, featuredDeals, latestArticles] =
    await Promise.all([
      getCategories(),
      getFeaturedOffers(6),
      getFeaturedDeals(6),
      getLatestArticles(6),
    ]);

  const offerItems = (featuredOffers || []).map((offer, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    url: `${SITE_URL}/offers/${offer.slug}`,
    name: offer.title,
  }));

  const dealItems = (featuredDeals || []).map((deal, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    url: `${SITE_URL}/deals/${deal.slug}`,
    name: deal.title,
  }));

  const articleItems = (latestArticles || []).map((article, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    url: `${SITE_URL}/blog/${article.slug}`,
    name: article.title,
  }));

  const categoryItems = (categories || []).map((category: any, index: number) => {
    let basePath = 'blog';
    if (category.type === 'offers') basePath = 'offers';
    else if (category.type === 'deals') basePath = 'deals';

    return {
      '@type': 'ListItem',
      position: index + 1,
      name: category.name,
      url: `${SITE_URL}/${basePath}/category/${category.slug}`,
    };
  });

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${SITE_URL}#website`,
        url: SITE_URL,
        name: SITE_NAME,
        description: DEFAULT_DESCRIPTION,
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
        '@type': 'Organization',
        '@id': `${SITE_URL}#organization`,
        name: SITE_NAME,
        url: SITE_URL,
        logo: {
          '@type': 'ImageObject',
          url: `${SITE_URL}/img/logo.png`,
          width: 512,
          height: 512,
          caption: `${SITE_NAME} Logo`,
        },
        description: `${SITE_NAME} is a curated platform connecting users with verified online offers and exclusive deals from trusted brands.`,
        email: 'support@rafdeals.com',
        foundingDate: '2026',
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
          url: `${SITE_URL}/contact`,
        },
      },
      {
        '@type': 'WebPage',
        '@id': `${SITE_URL}#webpage`,
        url: SITE_URL,
        name: DEFAULT_TITLE,
        description: DEFAULT_DESCRIPTION,
        isPartOf: { '@id': `${SITE_URL}#website` },
        inLanguage: 'en-US',
        breadcrumb: { '@id': `${SITE_URL}#breadcrumb` },
        primaryImageOfPage: {
          '@type': 'ImageObject',
          url: `${SITE_URL}/img/og-default.jpg`,
          width: 1254,
          height: 1254,
        },
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${SITE_URL}#breadcrumb`,
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
        ],
      },
      {
        '@type': 'ItemList',
        name: 'Featured Verified Offers',
        url: `${SITE_URL}/offers`,
        itemListElement: offerItems,
        numberOfItems: offerItems.length,
      },
      {
        '@type': 'ItemList',
        name: 'Featured Exclusive Deals',
        url: `${SITE_URL}/deals`,
        itemListElement: dealItems,
        numberOfItems: dealItems.length,
      },
      {
        '@type': 'ItemList',
        name: 'Latest Deals & Offers Articles',
        url: `${SITE_URL}/blog`,
        itemListElement: articleItems,
        numberOfItems: articleItems.length,
      },
      {
        '@type': 'ItemList',
        name: 'Offers & Deals Categories',
        itemListElement: categoryItems,
        numberOfItems: categoryItems.length,
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

export default async function HomePage() {
  const latestArticles = await getLatestArticles(9); // 3 slides × 3 cards

  return (
    <>
      <HomepageJsonLd />
      <Hero />
      <FeaturedOffers />
      <FeaturedDeals />
      <HowItWorks />
      <LatestBlog articles={latestArticles} />
      <AdPlacement placement="home" />
      <StatsSection />
      <AboutUs />
      <AdSense placement="home" />
      <Testimonials />
      <FAQSection />
      <CTABanner />
    </>
  );
}