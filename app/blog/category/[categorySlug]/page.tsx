import { Fragment } from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, Tag } from 'lucide-react';
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

  // Get category details
  const category = await getCategoryBySlug(categorySlug);
  if (!category) notFound();

  // Get offers for this category
  let offers = await getOffersByCategorySlug(categorySlug);

  // Filter by search
  if (search) {
    const searchLower = search.toLowerCase();
    offers = offers.filter(offer =>
      offer.title.toLowerCase().includes(searchLower) ||
      (offer.description || '').toLowerCase().includes(searchLower)
    );
  }

  // Sort
  switch (sort) {
    case 'newest':
      offers.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      break;
    case 'oldest':
      offers.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      break;
    case 'popular':
      offers.sort((a, b) => (b.views || 0) - (a.views || 0));
      break;
    case 'highest-rated':
      offers.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      break;
    default:
      break;
  }

  const totalOffers = offers.length;
  const totalPages = Math.ceil(totalOffers / limit);
  const startIndex = (page - 1) * limit;
  const paginatedOffers = offers.slice(startIndex, startIndex + limit);

  const sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'popular', label: 'Most Popular' },
    { value: 'highest-rated', label: 'Highest Rated' },
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
          HERO - Category Header
          ============================================================ */}
      <div className="bg-navy pt-24 pb-10 border-b border-border-gray/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center gap-3 mb-2">
            <Link href="/offers" className="text-white/50 hover:text-yellow text-sm transition-colors flex items-center gap-1">
              Offers
            </Link>
            <ChevronRight size={14} className="text-white/30" />
            <span className="text-yellow text-sm font-semibold">{category.name}</span>
          </div>
          <div className="flex items-center gap-3 mt-2">
            <div className="w-10 h-10 bg-yellow/20 text-yellow flex items-center justify-center border border-yellow/30">
              <Tag size={20} />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {category.name}
              </h1>
            </div>
          </div>
          <p className="text-white/50 text-sm mt-3">
            {totalOffers} {totalOffers === 1 ? 'offer' : 'offers'} in this category
          </p>
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
          OFFERS GRID
          ============================================================ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-16">
        
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
            <div className="mb-6">
              <AdPlacement placement="offers" />
            </div>

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