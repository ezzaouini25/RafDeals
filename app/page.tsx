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
import { getLatestArticles } from '@/lib/queries';

export const revalidate = 3600;

export default async function HomePage() {
  const latestArticles = await getLatestArticles(9); // 3 slides × 3 cards

  return (
    <>
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