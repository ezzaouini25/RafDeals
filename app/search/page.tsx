import React from 'react';
import Link from 'next/link';
import { Search, ChevronRight, HelpCircle, FileText, Gift, Sparkles, Compass, X, Tag } from 'lucide-react';
import { getAllArticles, getAllOffers, getAllDeals } from '@/lib/queries'; // ✅ Added getAllDeals
import { Article, Offer, Deal } from '@/types'; // ✅ Added Deal type
import BlogCard from '@/components/ui/BlogCard';
import OfferCard from '@/components/ui/OfferCard';
import AdPlacement from '@/components/ui/AdPlacement';
import GoogleAdSense from '@/components/ui/GoogleAdSense';

export const revalidate = 60;

interface SearchPageProps {
  searchParams: Promise<{ q?: string }>;
}

// ============================================================
// SAFE STRING HELPER (Fixes the TypeError)
// ============================================================
const safeString = (val: any): string => {
  if (!val) return '';
  if (typeof val === 'string') return val.toLowerCase();
  if (Array.isArray(val)) {
    return val.map(v => typeof v === 'string' ? v : (v?.name || '')).join(' ').toLowerCase();
  }
  if (typeof val === 'object') {
    return (val.name || val.title || '').toLowerCase();
  }
  return String(val).toLowerCase();
};

// ============================================================
// SEARCH ALGORITHM - EXACT MATCHING
// ============================================================
function performSearch(articles: Article[], offers: Offer[], deals: Deal[], query: string) {
  if (!query || query.trim() === '') {
    return { filteredArticles: [], filteredOffers: [], filteredDeals: [] };
  }

  const searchLower = query.toLowerCase().trim();
  const searchWords = searchLower.split(/\s+/).filter(w => w.length > 1);

  // ✅ Safe matching for Articles
  const articleMatches = (article: Article): boolean => {
    const title = safeString(article.title);
    const desc = safeString(article.description);
    const content = safeString(article.content);
    const category = safeString(article.category);
    const keywords = safeString(article.meta_keywords);
    const slug = safeString(article.slug);

    if (title.includes(searchLower) || desc.includes(searchLower) || keywords.includes(searchLower) || category.includes(searchLower) || slug.includes(searchLower.replace(/\s+/g, '-'))) return true;

    for (const word of searchWords) {
      if (title.includes(word) || desc.includes(word) || keywords.includes(word) || category.includes(word) || content.includes(word) || slug.includes(word.replace(/\s+/g, '-'))) return true;
    }
    return false;
  };

  // ✅ Safe matching for Offers
  const offerMatches = (offer: Offer): boolean => {
    const title = safeString(offer.title);
    const desc = safeString(offer.description);
    const content = safeString(offer.content);
    const type = safeString(offer.type);
    const keywords = safeString(offer.meta_keywords);
    const payout = safeString(offer.payout_amount);
    const slug = safeString(offer.slug);

    if (title.includes(searchLower) || desc.includes(searchLower) || keywords.includes(searchLower) || type.includes(searchLower) || payout.includes(searchLower) || slug.includes(searchLower.replace(/\s+/g, '-'))) return true;

    for (const word of searchWords) {
      if (title.includes(word) || desc.includes(word) || keywords.includes(word) || type.includes(word) || content.includes(word) || payout.includes(word) || slug.includes(word.replace(/\s+/g, '-'))) return true;
    }
    return false;
  };

  // ✅ Safe matching for Deals
  const dealMatches = (deal: Deal): boolean => {
    const title = safeString(deal.title);
    const desc = safeString(deal.description);
    const content = safeString(deal.content);
    const category = safeString(deal.category);
    const keywords = safeString(deal.meta_keywords);
    const slug = safeString(deal.slug);

    if (title.includes(searchLower) || desc.includes(searchLower) || keywords.includes(searchLower) || category.includes(searchLower) || slug.includes(searchLower.replace(/\s+/g, '-'))) return true;

    for (const word of searchWords) {
      if (title.includes(word) || desc.includes(word) || keywords.includes(word) || category.includes(word) || content.includes(word) || slug.includes(word.replace(/\s+/g, '-'))) return true;
    }
    return false;
  };

  return {
    filteredArticles: articles.filter(articleMatches),
    filteredOffers: offers.filter(offerMatches),
    filteredDeals: deals.filter(dealMatches),
  };
}

// ============================================================
// MAIN PAGE
// ============================================================
export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q: rawQuery } = await searchParams;
  const query = (rawQuery || '').trim();

  // Load all items
  const [allArticles, allOffers, allDeals] = await Promise.all([
    getAllArticles(),
    getAllOffers(),
    getAllDeals() // ✅ Fetch Deals
  ]);

  // Perform search
  const { filteredArticles, filteredOffers, filteredDeals } = performSearch(allArticles, allOffers, allDeals, query);

  const hasResults = filteredArticles.length > 0 || filteredOffers.length > 0 || filteredDeals.length > 0;
  const totalResults = filteredArticles.length + filteredOffers.length + filteredDeals.length;

  // Popular suggestions (Updated for RafDeals)
  const popularTerms = [
    { label: 'Bank Bonuses', q: 'bank' },
    { label: 'Sign Up Offers', q: 'sign up' },
    { label: 'Tech Deals', q: 'tech' },
    { label: 'Travel Promos', q: 'travel' },
    { label: 'Cashback Apps', q: 'cashback' },
    { label: 'Welcome Offers', q: 'welcome' },
    { label: 'Free Trials', q: 'trial' },
    { label: 'Exclusive Deals', q: 'exclusive' },
  ];

  return (
    <div className="bg-white min-h-screen pb-20">
      {/* Breadcrumb */}
      <div className="bg-light-gray border-b border-border-gray py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-2 text-sm text-gray-text">
          <Link href="/" className="hover:text-navy transition-colors">Home</Link>
          <ChevronRight size={14} className="text-gray-text/60" />
          <span className="text-navy font-semibold">Search Results</span>
          {query && (
            <>
              <ChevronRight size={14} className="text-gray-text/60" />
              <span className="text-navy font-semibold line-clamp-1 max-w-[200px]">&quot;{query}&quot;</span>
            </>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        {/* Search Header and Form */}
        <div className="max-w-3xl mx-auto text-center mb-12">
          <h1 className="text-3xl sm:text-4xl font-black text-navy tracking-tight mb-4 uppercase">
            Search RafDeals
          </h1>
          <p className="text-gray-text text-sm sm:text-base mb-8 font-medium">
            Find verified online offers, exclusive deals, and helpful guides.
          </p>

          <form action="/search" method="GET" className="flex items-center gap-2 max-w-2xl mx-auto bg-light-gray border border-border-gray p-1.5 focus-within:ring-2 focus-within:ring-navy/20 focus-within:border-navy transition-all rounded-none">
            <div className="flex-1 flex items-center gap-2.5 px-3 sm:px-4">
              <Search className="text-navy/50 shrink-0" size={18} />
              <input
                type="text"
                name="q"
                defaultValue={query}
                placeholder="Search offers, deals, guides, or keywords..."
                className="w-full bg-transparent text-sm text-navy focus:outline-none placeholder:text-gray-text/40 py-2 sm:py-2.5 font-semibold"
                aria-label="Search query"
              />
              {query && (
                <Link
                  href="/search"
                  className="text-gray-text/40 hover:text-navy transition-colors"
                  aria-label="Clear search"
                >
                  <X size={16} />
                </Link>
              )}
            </div>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 sm:px-6 py-2.5 bg-yellow hover:bg-yellow-hover text-navy text-xs font-black tracking-wider uppercase transition-all duration-200 active:scale-95 shadow-[0_4px_12px_rgba(234,179,8,0.2)] hover:shadow-[0_4px_18px_rgba(234,179,8,0.35)] shrink-0 min-h-[40px] cursor-pointer border border-yellow rounded-none"
            >
              <Search size={13} className="stroke-[3px]" />
              <span className="hidden xs:inline">Search</span>
            </button>
          </form>

          {/* Quick Suggestions */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs">
            <span className="text-gray-text/75 font-semibold flex items-center gap-1">
              <Sparkles size={12} className="text-yellow" /> Suggestions:
            </span>
            {popularTerms.map((term, idx) => (
              <a
                key={idx}
                href={`/search?q=${encodeURIComponent(term.q)}`}
                className="px-2.5 py-1 bg-light-gray/60 hover:bg-yellow/15 border border-border-gray/55 hover:border-yellow text-navy font-semibold transition-colors text-[11px] rounded-none"
              >
                {term.label}
              </a>
            ))}
          </div>

          {/* Results count */}
          {query && hasResults && (
            <div className="mt-4 text-sm text-gray-text">
              Found <span className="font-bold text-navy">{totalResults}</span> result{totalResults !== 1 ? 's' : ''} for &ldquo;<span className="font-bold text-navy">{query}</span>&rdquo;
            </div>
          )}
        </div>

        {query === '' ? (
          /* Empty Search State */
          <div className="max-w-2xl mx-auto bg-light-gray/45 border border-border-gray/50 p-8 text-center shadow-sm rounded-none">
            <div className="w-12 h-12 bg-yellow/20 text-navy flex items-center justify-center mx-auto mb-4 rounded-none">
              <Compass size={22} className="animate-spin-slow" />
            </div>
            <h2 className="text-lg font-black text-navy mb-2 uppercase tracking-tight">Explore Our Database</h2>
            <p className="text-gray-text text-sm leading-relaxed max-w-md mx-auto mb-6">
              Enter a search query in the field above or select one of our popular suggestions to browse hundreds of verified offers and deals.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md mx-auto">
              <Link
                href="/offers"
                className="p-4 bg-white border border-border-gray hover:border-yellow transition-all shadow-sm flex items-center gap-3 rounded-none"
              >
                <Gift className="text-yellow shrink-0" size={18} />
                <div className="text-left">
                  <h4 className="text-xs font-extrabold text-navy uppercase">Browse Offers</h4>
                  <p className="text-[10px] text-gray-text mt-0.5">Verified bonuses</p>
                </div>
              </Link>
              <Link
                href="/deals"
                className="p-4 bg-white border border-border-gray hover:border-yellow transition-all shadow-sm flex items-center gap-3 rounded-none"
              >
                <Tag className="text-yellow shrink-0" size={18} />
                <div className="text-left">
                  <h4 className="text-xs font-extrabold text-navy uppercase">Browse Deals</h4>
                  <p className="text-[10px] text-gray-text mt-0.5">Exclusive discounts</p>
                </div>
              </Link>
            </div>
          </div>
        ) : !hasResults ? (
          /* No Results State */
          <div className="max-w-2xl mx-auto bg-light-gray/45 border border-border-gray/50 p-8 text-center shadow-sm rounded-none">
            <div className="w-12 h-12 bg-navy/10 text-navy flex items-center justify-center mx-auto mb-4 rounded-none">
              <HelpCircle size={22} />
            </div>
            <h2 className="text-lg font-black text-navy mb-2 uppercase tracking-tight">No Results Found for &ldquo;{query}&rdquo;</h2>
            <p className="text-gray-text text-sm leading-relaxed max-w-md mx-auto mb-4">
              We couldn&apos;t find any matching offers, deals, or articles for that phrase.
            </p>
            <div className="bg-white border border-border-gray p-4 text-left text-xs max-w-md mx-auto mb-6 rounded-none">
              <p className="font-extrabold text-navy mb-2 uppercase">Search Recommendations:</p>
              <ul className="list-disc pl-4 text-gray-text space-y-1.5">
                <li>Double check your spelling or try fewer keywords.</li>
                <li>Search for categories like <span className="font-bold">bonuses</span>, <span className="font-bold">cashback</span>, or <span className="font-bold">travel</span>.</li>
                <li>Search by brand name or offer title.</li>
              </ul>
            </div>
            <div className="flex flex-col sm:flex-row justify-center gap-3">
              <Link
                href="/offers"
                className="px-5 py-2.5 bg-yellow hover:bg-yellow-hover text-navy text-xs font-bold transition-colors text-center border border-yellow rounded-none uppercase tracking-wide"
              >
                Browse All Offers
              </Link>
              <Link
                href="/deals"
                className="px-5 py-2.5 border border-border-gray hover:bg-light-gray text-navy text-xs font-bold transition-colors text-center rounded-none uppercase tracking-wide"
              >
                Browse All Deals
              </Link>
            </div>
          </div>
        ) : (
          /* Results Display */
          <div className="space-y-12">
            
            {/* Sponsor Ad - Top */}
            <div className="mb-4">
              <AdPlacement placement="home" />
            </div>

            {/* Offers Results */}
            {filteredOffers.length > 0 && (
              <div>
                <div className="flex items-center justify-between border-b border-border-gray/60 pb-3 mb-6">
                  <h2 className="text-xl sm:text-2xl font-black text-navy flex items-center gap-2 uppercase tracking-tight">
                    <Gift size={20} className="text-yellow" />
                    Verified Offers ({filteredOffers.length})
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredOffers.map((offer, index) => (
                    <React.Fragment key={offer.id}>
                      <OfferCard offer={offer} />
                      {index === 0 && (
                        <div className="col-span-full my-4">
                          <GoogleAdSense placement="home" />
                        </div>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            )}

            {/* Deals Results */}
            {filteredDeals.length > 0 && (
              <div>
                <div className="flex items-center justify-between border-b border-border-gray/60 pb-3 mb-6">
                  <h2 className="text-xl sm:text-2xl font-black text-navy flex items-center gap-2 uppercase tracking-tight">
                    <Tag size={20} className="text-yellow" />
                    Exclusive Deals ({filteredDeals.length})
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Assuming you have a DealCard component, if not, replace with OfferCard or create one */}
                  {filteredDeals.map((deal, index) => (
                    <React.Fragment key={deal.id}>
                      <OfferCard offer={deal as any} /> {/* Fallback to OfferCard if DealCard isn't ready */}
                      {index === 0 && filteredOffers.length === 0 && (
                        <div className="col-span-full my-4">
                          <GoogleAdSense placement="home" />
                        </div>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            )}

            {/* Articles Results */}
            {filteredArticles.length > 0 && (
              <div>
                <div className="flex items-center justify-between border-b border-border-gray/60 pb-3 mb-6">
                  <h2 className="text-xl sm:text-2xl font-black text-navy flex items-center gap-2 uppercase tracking-tight">
                    <FileText size={20} className="text-yellow" />
                    Guides & Insights ({filteredArticles.length})
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredArticles.map((article, index) => (
                    <React.Fragment key={article.id}>
                      <BlogCard article={article} />
                      {index === 0 && filteredOffers.length === 0 && filteredDeals.length === 0 && (
                        <div className="col-span-full my-4">
                          <GoogleAdSense placement="in_content_top" />
                        </div>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}