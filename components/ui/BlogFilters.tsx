'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ChevronDown } from 'lucide-react';

interface BlogFiltersProps {
  categorySlug: string;
  categoryName: string;
  search: string;
  sort: string;
  totalArticles: number;
  paginatedCount: number;
  sortOptions: { value: string; label: string }[];
}

export default function BlogFilters({
  categorySlug,
  categoryName,
  search,
  sort,
  totalArticles,
  paginatedCount,
  sortOptions,
}: BlogFiltersProps) {
  const [searchValue, setSearchValue] = useState(search);
  const [sortValue, setSortValue] = useState(sort);

  const buildUrl = (newParams: Record<string, string>) => {
    const url = new URLSearchParams();
    if (searchValue) url.set('search', searchValue);
    if (sortValue !== 'newest') url.set('sort', sortValue);
    
    Object.entries(newParams).forEach(([key, value]) => {
      if (value) {
        url.set(key, value);
      } else {
        url.delete(key);
      }
    });
    
    const queryString = url.toString();
    return queryString ? `/blog/category/${categorySlug}?${queryString}` : `/blog/category/${categorySlug}`;
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    window.location.href = buildUrl({ page: '1' });
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSort = e.target.value;
    setSortValue(newSort);
    window.location.href = buildUrl({ sort: newSort, page: '1' });
  };

  return (
    <div className="bg-white border-b border-border-gray sticky top-16 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-wrap items-center gap-3">
          
          <Link
            href="/blog"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-text hover:text-navy transition-colors"
          >
            <ArrowLeft size={14} />
            All Articles
          </Link>

          <div className="w-px h-6 bg-border-gray" />

          <form onSubmit={handleSearchSubmit} className="flex-1 min-w-[180px] max-w-[300px]">
            <input
              type="text"
              name="search"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder={`Search ${categoryName}...`}
              className="w-full px-4 py-2 bg-light-gray/60 border border-border-gray focus:border-navy text-sm text-navy outline-none transition-all"
            />
          </form>

          <div className="relative">
            <select
              value={sortValue}
              onChange={handleSortChange}
              className="appearance-none pl-4 pr-10 py-2 bg-light-gray/60 border border-border-gray focus:border-navy text-sm text-navy outline-none cursor-pointer transition-all min-w-[140px]"
            >
              {sortOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-text/50 pointer-events-none" size={14} />
          </div>

          <span className="text-sm text-gray-text ml-auto">
            {paginatedCount} of {totalArticles} articles
          </span>
        </div>
      </div>
    </div>
  );
}