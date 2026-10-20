'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Search, Filter, ArrowUpDown, X, Gift, ArrowLeft, ArrowRight } from 'lucide-react';
import { Deal } from '@/types'; // ✅ CHANGED FROM Offer TO Deal
import DealCard from '@/components/ui/DealCard';
import AdPlacement from '@/components/ui/AdPlacement';

const ITEMS_PER_PAGE = 9;

interface DealsListProps {
  initialDeals: Deal[]; // ✅ CHANGED FROM Offer TO Deal
}

// ============================================================
// EXTRACT NUMERIC VALUE FROM PAYOUT AMOUNT
// ============================================================
const extractPayoutValue = (payout: string | null): number => {
  if (!payout) return 0;
  const cleaned = payout.replace(/[$,]/g, '').trim();
  const match = cleaned.match(/^([\d.]+)/);
  if (match) return parseFloat(match[1]);
  const rangeMatch = payout.match(/\$?([\d.]+)\s*-\s*\$?([\d.]+)/);
  if (rangeMatch) return parseFloat(rangeMatch[1]);
  return 0;
};

export default function DealsList({ initialDeals }: DealsListProps) {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);

  // Get latest deal for hero background
  const latestDeal = initialDeals.length > 0 ? initialDeals[0] : null;

  // Get all unique categories
  const categories = useMemo(() => {
    const map = new Map<string, string>();
    initialDeals.forEach((d) => {
      if (d.category?.slug && d.category?.name) {
        map.set(d.category.slug, d.category.name);
      }
    });
    return Array.from(map.entries()).map(([slug, name]) => ({ slug, name }));
  }, [initialDeals]);

  // Filter and sort deals
  const filtered = useMemo(() => {
    let result = [...initialDeals];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (d) =>
          d.title.toLowerCase().includes(q) ||
          (d.content?.toLowerCase().includes(q) ?? false) ||
          (d.meta_keywords?.toLowerCase().includes(q) ?? false)
      );
    }

    if (categoryFilter !== 'all') {
      result = result.filter((d) => d.category?.slug === categoryFilter);
    }

    switch (sortBy) {
      case 'newest':
        result.sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
        break;
      case 'oldest':
        result.sort((a, b) => +new Date(a.created_at) - +new Date(b.created_at));
        break;
      case 'rating-high':
        result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'rating-low':
        result.sort((a, b) => (a.rating || 0) - (b.rating || 0));
        break;
      case 'price-low':
        result.sort((a, b) => extractPayoutValue(a.payout_amount) - extractPayoutValue(b.payout_amount));
        break;
      case 'price-high':
        result.sort((a, b) => extractPayoutValue(b.payout_amount) - extractPayoutValue(a.payout_amount));
        break;
      case 'popular':
        result.sort((a, b) => (b.views || 0) - (a.views || 0));
        break;
      case 'boosted':
        result.sort((a, b) => {
          if (a.is_boosted && !b.is_boosted) return -1;
          if (!a.is_boosted && b.is_boosted) return 1;
          return 0;
        });
        break;
      default:
        break;
    }

    return result;
  }, [initialDeals, search, categoryFilter, sortBy]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = useMemo(() => {
    return filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  }, [filtered, currentPage]);

  const hasResults = paginated.length > 0;

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const clearFilters = () => {
    setSearch('');
    setCategoryFilter('all');
    setSortBy('newest');
    setCurrentPage(1);
  };

  const sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'rating-high', label: 'Highest Rated' },
    { value: 'rating-low', label: 'Lowest Rated' },
    { value: 'price-low', label: 'Price: Low to High' },
    { value: 'price-high', label: 'Price: High to Low' },
    { value: 'popular', label: 'Most Popular' },
    { value: 'boosted', label: 'Featured First' },
  ];

  return (
    <div className="bg-white min-h-screen">

      {/* HERO */}
      <div className="relative min-h-[280px] sm:min-h-[340px] flex items-center overflow-hidden pt-16 sm:pt-20">
        {latestDeal?.cover_image ? (
          <div className="absolute inset-0 z-0">
            <Image
              src={latestDeal.cover_image}
              alt="Deals hero background"
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
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight leading-tight">
              Hot Deals & Discounts
            </h1>
            <p className="text-white/80 text-sm sm:text-base mt-2 max-w-xl">
              Discover the best deals, coupons, and discounts from trusted brands.
            </p>
            <div className="flex flex-wrap items-center gap-3 mt-4">
              <Link
                href="#deals-grid"
                className="inline-flex items-center gap-2 px-5 py-2 bg-yellow text-navy font-bold text-sm border border-yellow hover:bg-yellow-hover transition-colors"
              >
                Browse Deals
                <ArrowRight size={14} />
              </Link>
              <Link
                href="/blog"
                className="inline-flex items-center gap-2 px-5 py-2 border border-white/30 text-white font-bold text-sm hover:bg-white/10 transition-colors"
              >
                Read Guides
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="sticky top-16 z-30 bg-white border-b border-border-gray">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-wrap items-center gap-3">

            <div className="relative flex-1 min-w-[180px] max-w-[380px]">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-soft-navy" />
              <input
                type="text"
                placeholder="Search deals..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full h-11 pl-10 pr-4 text-sm border border-border-gray focus:border-navy bg-white text-mid-navy outline-none transition-all"
              />
              {search && (
                <button
                  onClick={() => {
                    setSearch('');
                    setCurrentPage(1);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-text/40 hover:text-navy transition-colors"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Filter size={16} className="text-soft-navy flex-shrink-0" />
              <select
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="h-11 px-3 text-sm border border-border-gray bg-white text-mid-navy outline-none cursor-pointer transition-all min-w-[140px]"
              >
                <option value="all">All Categories</option>
                {categories.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <ArrowUpDown size={16} className="text-soft-navy flex-shrink-0" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="h-11 px-3 text-sm border border-border-gray bg-white text-mid-navy outline-none cursor-pointer transition-all min-w-[160px]"
              >
                {sortOptions.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            <span className="ml-auto text-sm text-soft-navy font-medium whitespace-nowrap">
              Showing {filtered.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)} of {filtered.length} deals
            </span>
          </div>
        </div>
      </div>

      {/* AD */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <AdPlacement placement="offers" />
      </div>

      {/* GRID */}
      <div id="deals-grid" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {!hasResults ? (
          <div className="bg-light-gray/40 border border-border-gray p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 bg-navy/10 text-navy flex items-center justify-center mx-auto mb-4">
                <Gift size={28} />
              </div>
              <h3 className="text-xl font-bold text-navy">No deals found</h3>
              <p className="text-gray-text text-sm mt-2">
                Try adjusting your search or filter criteria
              </p>
              <button
                onClick={clearFilters}
                className="inline-block mt-4 px-6 py-2.5 bg-yellow text-navy font-bold text-sm border border-yellow hover:bg-yellow-hover transition-colors"
              >
                Clear all filters
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginated.map((deal) => (
                <DealCard key={deal.id} deal={deal} />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-10">
                <button
                  onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className={`px-4 py-2 border border-border-gray text-sm font-medium text-navy hover:bg-light-gray transition-colors flex items-center gap-1.5 ${
                    currentPage === 1 ? 'opacity-40 pointer-events-none' : ''
                  }`}
                >
                  <ArrowLeft size={14} />
                  Previous
                </button>

                {[...Array(Math.min(totalPages, 5))].map((_, i) => {
                  let pageNum = i + 1;
                  if (totalPages > 5 && currentPage > 3) {
                    pageNum = currentPage - 2 + i;
                    if (pageNum > totalPages) return null;
                  }
                  if (pageNum > totalPages) return null;

                  const isActive = pageNum === currentPage;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`w-10 h-10 flex items-center justify-center border border-border-gray text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-navy text-white border-navy'
                          : 'text-navy hover:bg-light-gray'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                {totalPages > 5 && currentPage < totalPages - 2 && (
                  <span className="text-gray-text px-2">...</span>
                )}

                <button
                  onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className={`px-4 py-2 border border-border-gray text-sm font-medium text-navy hover:bg-light-gray transition-colors flex items-center gap-1.5 ${
                    currentPage === totalPages ? 'opacity-40 pointer-events-none' : ''
                  }`}
                >
                  Next
                  <ArrowRight size={14} />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}