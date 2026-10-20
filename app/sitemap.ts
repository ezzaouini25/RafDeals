import { MetadataRoute } from 'next';
import { getAllOffers, getAllDeals, getAllArticles, getAllLegalPageSlugs } from '@/lib/queries';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // ✅ Updated to RafDeals domain
  const baseUrl = process.env.APP_URL || 'https://rafdeals.com';

  const [offers, deals, articles, legalPages] = await Promise.all([
    getAllOffers(),
    getAllDeals(), // ✅ Added Deals
    getAllArticles(),
    getAllLegalPageSlugs(),
  ]);

  const staticRoutes = [
    { url: baseUrl, lastModified: new Date(), priority: 1.0 },
    { url: `${baseUrl}/offers`, lastModified: new Date(), priority: 0.9 },
    { url: `${baseUrl}/deals`, lastModified: new Date(), priority: 0.9 }, // ✅ Added Deals Page
    { url: `${baseUrl}/blog`, lastModified: new Date(), priority: 0.9 },
    { url: `${baseUrl}/contact`, lastModified: new Date(), priority: 0.5 },
  ];

  const offerRoutes = offers.map((o) => ({
    url: `${baseUrl}/offers/${o.slug}`,
    lastModified: new Date(o.updated_at),
    priority: 0.8,
  }));

  // ✅ Added Deal Routes
  const dealRoutes = deals.map((d) => ({
    url: `${baseUrl}/deals/${d.slug}`,
    lastModified: new Date(d.updated_at),
    priority: 0.8,
  }));

  const articleRoutes = articles.map((a) => ({
    url: `${baseUrl}/blog/${a.slug}`,
    lastModified: new Date(a.updated_at),
    priority: 0.8,
  }));

  const legalRoutes = legalPages.map((p) => ({
    url: `${baseUrl}/legal/${p.slug}`,
    lastModified: new Date(),
    priority: 0.3,
  }));

  return [...staticRoutes, ...offerRoutes, ...dealRoutes, ...articleRoutes, ...legalRoutes];
}