import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FileText, ArrowLeft, ArrowRight } from 'lucide-react';
import { getAllArticles, getCategories } from '@/lib/queries';
import BlogCard from '@/components/ui/BlogCard';
import AdPlacement from '@/components/ui/AdPlacement';
import GoogleAdSense from '@/components/ui/GoogleAdSense';
import BlogFilters from './BlogFilters';

export const revalidate = 60;

interface BlogPageProps {
  searchParams: Promise<{
    search?: string;
    category?: string;
    sort?: string;
    page?: string;
  }>;
}

// ============================================================
// BLOG PAGE
// ============================================================

export default async function BlogPage({ searchParams }: BlogPageProps) {
  const params = await searchParams;
  const search = params.search || '';
  const category = params.category || 'all';
  const sort = params.sort || 'newest';
  const page = parseInt(params.page || '1');
  const limit = 9;

  // Fetch all articles
  const allArticles = await getAllArticles();

  // Get all categories
  const categories = await getCategories('articles');

  // Get latest article for hero background image
  const latestArticle = allArticles.length > 0 ? allArticles[0] : null;

  // ============================================================
  // FILTER ARTICLES
  // ============================================================
  
  let filteredArticles = allArticles;

  // Filter by search
  if (search) {
    const searchLower = search.toLowerCase();
    filteredArticles = filteredArticles.filter(article => {
      const title = article.title.toLowerCase();
      const desc = (article.description || '').toLowerCase();
      const content = (article.content || '').toLowerCase();
      const keywords = (article.meta_keywords || '').toLowerCase();
      
      return title.includes(searchLower) || 
             desc.includes(searchLower) || 
             content.includes(searchLower) || 
             keywords.includes(searchLower);
    });
  }

  // Filter by category
  if (category !== 'all') {
    filteredArticles = filteredArticles.filter(article => {
      return article?.category?.slug === category;
    });
  }

  // ============================================================
  // SORT ARTICLES
  // ============================================================
  
  switch (sort) {
    case 'newest':
      filteredArticles.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      break;
    case 'oldest':
      filteredArticles.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      break;
    case 'popular':
      filteredArticles.sort((a, b) => (b.views || 0) - (a.views || 0));
      break;
    case 'highest-rated':
      filteredArticles.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      break;
    default:
      break;
  }

  // ============================================================
  // PAGINATION
  // ============================================================
  
  const totalArticles = filteredArticles.length;
  const totalPages = Math.ceil(totalArticles / limit);
  const startIndex = (page - 1) * limit;
  const paginatedArticles = filteredArticles.slice(startIndex, startIndex + limit);

  const hasResults = paginatedArticles.length > 0;

  // Sort options
  const sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'popular', label: 'Most Popular' },
    { value: 'highest-rated', label: 'Highest Rated' },
  ];

  // Build filter URL - this stays in the server component
  const buildUrl = (newParams: Record<string, string>) => {
    const url = new URLSearchParams();
    
    if (search) url.set('search', search);
    if (category !== 'all') url.set('category', category);
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
    return queryString ? `/blog?${queryString}` : '/blog';
  };

  return (
    <div className="bg-white min-h-screen">
      
      {/* ============================================================
          HERO - SAME AS OFFERS
          ============================================================ */}
      <div className="relative min-h-[280px] sm:min-h-[340px] flex items-center overflow-hidden pt-16 sm:pt-20">
        
        {latestArticle?.cover_image ? (
          <div className="absolute inset-0 z-0">
            <Image
              src={latestArticle.cover_image}
              alt="Blog hero background"
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
              Money-Making Guides
            </h1>
            <p className="text-white/80 text-sm sm:text-base mt-2 max-w-xl">
              Expert strategies, reviews, and tips to help you earn more online.
            </p>
            <div className="flex flex-wrap items-center gap-3 mt-4">
              <Link
                href="#articles"
                className="inline-flex items-center gap-2 px-5 py-2 bg-yellow text-navy font-bold text-sm border border-yellow hover:bg-yellow-hover transition-colors"
              >
                Read Articles
                <ArrowRight size={14} />
              </Link>
              <Link
                href="/offers"
                className="inline-flex items-center gap-2 px-5 py-2 border border-white/30 text-white font-bold text-sm hover:bg-white/10 transition-colors"
              >
                Browse Offers
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================
          FILTER BAR - Client Component
          ============================================================ */}
      <BlogFilters 
        search={search}
        category={category}
        sort={sort}
        categories={categories}
        totalArticles={totalArticles}
        sortOptions={sortOptions}
        currentPage={page}
        categorySlug=""
        categoryName=""
        paginatedCount={paginatedArticles.length}
      />

      {/* ============================================================
          SPONSOR AD - TOP
          ============================================================ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <AdPlacement placement="blog" />
      </div>

      {/* ============================================================
          BLOG GRID
          ============================================================ */}
      <div id="articles" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        
        {!hasResults ? (
          <div className="bg-light-gray/40 border border-border-gray p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 bg-navy/10 text-navy flex items-center justify-center mx-auto mb-4">
                <FileText size={28} />
              </div>
              <h3 className="text-xl font-bold text-navy">No articles found</h3>
              <p className="text-gray-text text-sm mt-2">
                Try adjusting your search or filter criteria
              </p>
              <Link
                href="/blog"
                className="inline-block mt-4 px-6 py-2.5 bg-yellow text-navy font-bold text-sm border border-yellow hover:bg-yellow-hover transition-colors"
              >
                Clear all filters
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedArticles.map((article, index) => (
                <React.Fragment key={article.id}>
                  <BlogCard article={article} />
                  {index === 2 && (
                    <div className="col-span-full my-4">
                      <GoogleAdSense placement="in_content_middle" />
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>

            {/* ============================================================
                PAGINATION
                ============================================================ */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-10">
                <Link
                  href={buildUrl({ page: String(Math.max(1, page - 1)) })}
                  className={`px-4 py-2 border border-border-gray text-sm font-medium text-navy hover:bg-light-gray transition-colors flex items-center gap-1.5 ${
                    page <= 1 ? 'opacity-40 pointer-events-none' : ''
                  }`}
                >
                  <ArrowLeft size={14} />
                  Previous
                </Link>

                {[...Array(Math.min(totalPages, 5))].map((_, i) => {
                  let pageNum = i + 1;
                  if (totalPages > 5 && page > 3) {
                    pageNum = page - 2 + i;
                    if (pageNum > totalPages) return null;
                  }
                  if (pageNum > totalPages) return null;
                  
                  const isActive = pageNum === page;
                  return (
                    <Link
                      key={pageNum}
                      href={buildUrl({ page: String(pageNum) })}
                      className={`w-10 h-10 flex items-center justify-center border border-border-gray text-sm font-medium transition-colors ${
                        isActive
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
                  className={`px-4 py-2 border border-border-gray text-sm font-medium text-navy hover:bg-light-gray transition-colors flex items-center gap-1.5 ${
                    page >= totalPages ? 'opacity-40 pointer-events-none' : ''
                  }`}
                >
                  Next
                  <ArrowRight size={14} />
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}