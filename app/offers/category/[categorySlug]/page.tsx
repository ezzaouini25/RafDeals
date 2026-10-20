import { Fragment } from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronRight, Tag, ArrowRight } from 'lucide-react';
import { getCategoryBySlug, getOffersByCategorySlug, getCategories } from '@/lib/queries';
import OfferCard from '@/components/ui/OfferCard';
import AdPlacement from '@/components/ui/AdPlacement';
import GoogleAdSense from '@/components/ui/GoogleAdSense';
import CategoryFilterBar from '@/components/ui/CategoryFilterBar';

export const revalidate = 60;

interface CategoryPageProps {
  params: Promise<{ categorySlug: string }>;
  searchParams: Promise<{
    search?: string;
    sort?: string;
    page?: string;
  }>;
}

export async function generateStaticParams() {
  const categories = await getCategories('offers');
  return categories.map((cat) => ({
    categorySlug: cat.slug,
  }));
}

export default async function OffersCategoryPage({ params, searchParams }: CategoryPageProps) {
  const { categorySlug } = await params;
  const sp = await searchParams;
  const search = sp.search || '';
  const sort = sp.sort || 'newest';
  const page = parseInt(sp.page || '1');
  const limit = 9;

  // Get category details from categories table
  const category = await getCategoryBySlug(categorySlug);
  if (!category) notFound();

  // ✅ Get offers by category slug (uses category_id from offers table)
  let offers = await getOffersByCategorySlug(categorySlug);

  // Get latest offer for hero background
  const latestOffer = offers.length > 0 ? offers[0] : null;

  // ✅ FILTER BY SEARCH (checks offers table title/description)
  if (search) {
    const searchLower = search.toLowerCase();
    offers = offers.filter(offer =>
      offer.title.toLowerCase().includes(searchLower) ||
      (offer.description || '').toLowerCase().includes(searchLower)
    );
  }

  // ✅ SORT BY OFFERS TABLE FIELDS
  switch (sort) {
    case 'newest':
      // ✅ Sort by created_at from offers table
      offers.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      break;
    case 'oldest':
      // ✅ Sort by created_at from offers table
      offers.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      break;
    case 'popular':
      // ✅ Sort by views from offers table
      offers.sort((a, b) => (b.views || 0) - (a.views || 0));
      break;
    case 'highest-rated':
      // ✅ Sort by rating from offers table
      offers.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      break;
    case 'price-high':
      // ✅ Sort by payout_amount from offers table
      offers.sort((a, b) => {
        const getPayoutValue = (payout: string | null) => {
          if (!payout) return 0;
          const match = payout.match(/[\d.]+/);
          return match ? parseFloat(match[0]) : 0;
        };
        return getPayoutValue(b.payout_amount) - getPayoutValue(a.payout_amount);
      });
      break;
    case 'price-low':
      // ✅ Sort by payout_amount from offers table
      offers.sort((a, b) => {
        const getPayoutValue = (payout: string | null) => {
          if (!payout) return 0;
          const match = payout.match(/[\d.]+/);
          return match ? parseFloat(match[0]) : 0;
        };
        return getPayoutValue(a.payout_amount) - getPayoutValue(b.payout_amount);
      });
      break;
    default:
      break;
  }

  const totalOffers = offers.length;
  const totalPages = Math.ceil(totalOffers / limit);
  const startIndex = (page - 1) * limit;
  const paginatedOffers = offers.slice(startIndex, startIndex + limit);

  // ✅ SORT OPTIONS - all from offers table
  const sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'popular', label: 'Most Popular' },
    { value: 'highest-rated', label: 'Highest Rated' },
    { value: 'price-high', label: 'Price: High to Low' },
    { value: 'price-low', label: 'Price: Low to High' },
  ];

  const buildUrl = (newParams: Record<string, string>) => {
    const url = new URLSearchParams();
    if (search) url.set('search', search);
    if (sort !== 'newest') url.set('sort', sort);
    if (page > 1) url.set('page', String(page));
    
    Object.entries(newParams).forEach(([key, value]) => {
      if (value) {
        url.set(key, value);
      } else {
        url.delete(key);
      }
    });
    
    const queryString = url.toString();
    return queryString ? `/offers/category/${categorySlug}?${queryString}` : `/offers/category/${categorySlug}`;
  };

  return (
    <div className="bg-white min-h-screen">
      
      {/* ============================================================
          HERO - SAME AS OFFERS LIST (dynamic with latest offer cover)
          ============================================================ */}
      <div className="relative min-h-[280px] sm:min-h-[340px] flex items-center overflow-hidden pt-16 sm:pt-20">
        
        {latestOffer?.cover_image ? (
          <div className="absolute inset-0 z-0">
            <Image
              src={latestOffer.cover_image}
              alt={`${category.name} offers`}
              fill
              priority
              className="object-cover"
              sizes="100vw"
            />
          </div>
        ) : (
          <div className="absolute inset-0 z-0 bg-navy" />
        )}
        
        <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/70 to-navy/30 z-10 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-r from-navy/60 via-transparent to-navy/40 z-10 pointer-events-none" />
        
        <div className="relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <Link href="/offers" className="text-white/50 hover:text-yellow text-sm transition-colors flex items-center gap-1">
                Offers
              </Link>
              <ChevronRight size={14} className="text-white/30" />
              <span className="text-yellow text-sm font-semibold">{category.name}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight leading-tight">
              {category.name}
            </h1>
            <p className="text-white/80 text-sm sm:text-base mt-2 max-w-xl">
              Browse and compare {category.name.toLowerCase()} opportunities to earn extra cash online.
            </p>
            <div className="flex flex-wrap items-center gap-3 mt-4">
              <Link
                href="#offers-grid"
                className="inline-flex items-center gap-2 px-5 py-2 bg-yellow text-navy font-bold text-sm border border-yellow hover:bg-yellow-hover transition-colors"
              >
                Browse Offers
                <ArrowRight size={14} />
              </Link>
              <Link
                href="/blog"
                className="inline-flex items-center gap-2 px-5 py-2 border border-white/30 text-white font-bold text-sm hover:bg-white/10 transition-colors"
              >
                Read Guides
              </Link>
            </div>
            <p className="text-white/50 text-sm mt-4">
              {totalOffers} {totalOffers === 1 ? 'offer' : 'offers'} in this category
            </p>
          </div>
        </div>
      </div>

      {/* ============================================================
          FILTER BAR - Client Component
          ============================================================ */}
      <CategoryFilterBar
        categorySlug={categorySlug}
        categoryName={category.name}
        search={search}
        sort={sort}
        totalOffers={totalOffers}
        paginatedCount={paginatedOffers.length}
        sortOptions={sortOptions}
      />

      {/* ============================================================
          SPONSOR AD - TOP
          ============================================================ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <AdPlacement placement="offers" />
      </div>

      {/* ============================================================
          OFFERS GRID
          ============================================================ */}
      <div id="offers-grid" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        
        {paginatedOffers.length === 0 ? (
          <div className="bg-light-gray/40 border border-border-gray p-12 text-center">
            <div className="max-w-md mx-auto">
              <Tag size={48} className="mx-auto text-gray-text/20 mb-4" />
              <h3 className="text-xl font-bold text-navy">No offers found</h3>
              <p className="text-gray-text text-sm mt-2">
                No offers available in the "{category.name}" category
              </p>
              <Link
                href="/offers"
                className="inline-block mt-4 px-6 py-2.5 bg-yellow text-navy font-bold text-sm border border-yellow hover:bg-yellow-hover transition-colors"
              >
                Browse all offers
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedOffers.map((offer, index) => (
                <Fragment key={offer.id}>
                  <OfferCard offer={offer} />
                  {index === 2 && (
                    <div className="col-span-full my-4">
                      <GoogleAdSense placement="in_content_middle" />
                    </div>
                  )}
                </Fragment>
              ))}
            </div>

            {/* ============================================================
                PAGINATION
                ============================================================ */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-10">
                <Link
                  href={buildUrl({ page: String(Math.max(1, page - 1)) })}
                  className={`px-4 py-2 border border-border-gray text-sm font-medium text-navy hover:bg-light-gray transition-colors ${
                    page <= 1 ? 'opacity-40 pointer-events-none' : ''
                  }`}
                >
                  Previous
                </Link>

                {[...Array(Math.min(totalPages, 5))].map((_, i) => {
                  let pageNum = i + 1;
                  if (totalPages > 5 && page > 3) {
                    pageNum = page - 2 + i;
                    if (pageNum > totalPages) return null;
                  }
                  if (pageNum > totalPages) return null;
                  
                  return (
                    <Link
                      key={pageNum}
                      href={buildUrl({ page: String(pageNum) })}
                      className={`w-10 h-10 flex items-center justify-center border border-border-gray text-sm font-medium transition-colors ${
                        pageNum === page
                          ? 'bg-navy text-white border-navy'
                          : 'text-navy hover:bg-light-gray'
                      }`}
                    >
                      {pageNum}
                    </Link>
                  );
                })}

                {totalPages > 5 && page < totalPages - 2 && (
                  <span className="text-gray-text px-2">...</span>
                )}

                <Link
                  href={buildUrl({ page: String(Math.min(totalPages, page + 1)) })}
                  className={`px-4 py-2 border border-border-gray text-sm font-medium text-navy hover:bg-light-gray transition-colors ${
                    page >= totalPages ? 'opacity-40 pointer-events-none' : ''
                  }`}
                >
                  Next
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}