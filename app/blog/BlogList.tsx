'use client';

import { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { Article } from '@/types';
import BlogCard from '@/components/ui/BlogCard';
import Pagination from '@/components/ui/Pagination';
import AdPlacement from '@/components/ui/AdPlacement';
import { cn } from '@/lib/utils';

const ITEMS_PER_PAGE = 9;
const categories = ['all', 'get-paid-to', 'no-skills', 'side-hustles', 'scam-or-legit'];

interface BlogListProps {
  initialArticles: Article[];
}

export default function BlogList({ initialArticles }: BlogListProps) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  const filtered = useMemo(() => {
    let result = [...initialArticles];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.content.toLowerCase().includes(q) ||
          (a.description?.toLowerCase().includes(q) ?? false)
      );
    }
    if (category !== 'all') {
      result = result.filter((a) => a.category?.slug === category);
    }
    return result;
  }, [initialArticles, search, category]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = useMemo(() => {
    return filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  }, [filtered, currentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="bg-light-gray min-h-screen pb-16">
      {/* Header */}
<div className="bg-slate-900 border-b border-slate-800 py-16 sm:py-20">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
    <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight uppercase">
      Discover Top Opportunities & Insights
    </h1>
    <p className="text-slate-400 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
      Discover the best deals, coupons, and discounts from trusted brands
    </p>
  </div>
</div>

      {/* Filter Bar */}
      <div className="sticky top-16 z-40 bg-white border-b border-border-gray py-4 shadow-sm">
        <div className="max-w-container mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-text" />
            <input
              type="text"
              placeholder="Search articles..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full h-11 pl-10 pr-4 text-sm border border-border-gray rounded-input focus:outline-none focus:border-navy bg-white text-navy"
            />
          </div>

          {/* Category Chips */}
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => {
                  setCategory(c);
                  setCurrentPage(1);
                }}
                className={cn(
                  'px-4 py-2 text-xs sm:text-sm font-semibold rounded-full transition-colors focus:outline-none min-h-[38px] flex items-center',
                  category === c
                    ? 'bg-navy text-white shadow-sm'
                    : 'bg-light-gray text-gray-text hover:bg-border-gray/50'
                )}
              >
                {c === 'all' ? 'All' : c.replace(/-/g, ' ')}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <AdPlacement placement="blog" />
        <br />
        {paginated.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginated.map((article) => (
                <BlogCard key={article.id} article={article} />
              ))}
            </div>
            {totalPages > 1 && (
              <div className="mt-12">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-20 bg-white rounded-card shadow-sm border border-border-gray p-8">
            <p className="text-gray-text text-lg">No articles matched your criteria. Try adjusting your settings.</p>
          </div>
        )}
      </div>
    </div>
  );
}
