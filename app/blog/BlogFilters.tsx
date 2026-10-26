'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Search, Filter, ArrowUpDown, X, ChevronDown } from 'lucide-react';
import { Category } from '@/types';

interface BlogFiltersProps {
  search: string;
  category: string;
  sort: string;
  categories: Category[];
  totalArticles: number;
  sortOptions: { value: string; label: string }[];
  currentPage?: number;
  categorySlug?: string;
  categoryName?: string;
  paginatedCount?: number;
}

function BlogFiltersInner({
  search: initialSearch,
  category: initialCategory,
  sort: initialSort,
  categories,
  totalArticles,
  sortOptions,
  currentPage = 1,
  categorySlug = '',
  categoryName = '',
  paginatedCount = 0,
}: BlogFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [searchValue, setSearchValue] = useState(initialSearch);
  const [categoryValue, setCategoryValue] = useState(initialCategory);
  const [sortValue, setSortValue] = useState(initialSort);

  useEffect(() => {
    setSearchValue(initialSearch);
    setCategoryValue(initialCategory);
    setSortValue(initialSort);
  }, [initialSearch, initialCategory, initialSort]);

  const buildUrl = (newParams: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    
    Object.entries(newParams).forEach(([key, value]) => {
      if (value && value !== '') {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });
    
    if (params.get('search') === '') params.delete('search');
    if (params.get('category') === 'all') params.delete('category');
    if (params.get('sort') === 'newest') params.delete('sort');
    if (params.get('page') === '1') params.delete('page');
    
    const queryString = params.toString();
    const basePath = categorySlug ? `/blog/category/${categorySlug}` : '/blog';
    return queryString ? `${basePath}?${queryString}` : basePath;
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const url = buildUrl({ search: searchValue, page: '1' });
    router.push(url);
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCategory = e.target.value;
    setCategoryValue(newCategory);
    const url = buildUrl({ category: newCategory, page: '1' });
    router.push(url);
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSort = e.target.value;
    setSortValue(newSort);
    const url = buildUrl({ sort: newSort, page: '1' });
    router.push(url);
  };

  const clearSearch = () => {
    setSearchValue('');
    const url = buildUrl({ search: '', page: '1' });
    router.push(url);
  };

  const isCategoryPage = !!categorySlug && !!categoryName;

  return (
    <div className="sticky top-16 z-30 bg-white border-b border-border-gray">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-wrap items-center gap-3">
          
          {isCategoryPage && (
            <>
              <Link
                href="/blog"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-text hover:text-navy transition-colors whitespace-nowrap"
              >
                All Articles
              </Link>
              <div className="w-px h-6 bg-border-gray" />
            </>
          )}

          <form onSubmit={handleSearchSubmit} className="relative flex-1 min-w-[160px] max-w-[320px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-soft-navy" />
            <input
              type="text"
              name="search"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder={isCategoryPage ? `Search ${categoryName}...` : 'Search articles...'}
              className="w-full h-11 pl-10 pr-4 text-sm border border-border-gray focus:border-navy bg-white text-mid-navy outline-none transition-all"
            />
            {searchValue && (
              <button
                type="button"
                onClick={clearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-text/40 hover:text-navy transition-colors"
              >
                <X size={14} />
              </button>
            )}
          </form>

          <div className="relative flex items-center">
            <Filter size={16} className="absolute left-3 text-soft-navy pointer-events-none z-10" />
            <select
              value={categoryValue}
              onChange={handleCategoryChange}
              className="appearance-none h-11 pl-9 pr-8 text-sm border border-border-gray bg-white text-mid-navy outline-none cursor-pointer transition-all min-w-[140px]"
            >
              <option value="all">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.slug}>
                  {cat.name}
                </option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-3 text-gray-text/50 pointer-events-none" />
          </div>

          <div className="relative flex items-center">
            <ArrowUpDown size={16} className="absolute left-3 text-soft-navy pointer-events-none z-10" />
            <select
              value={sortValue}
              onChange={handleSortChange}
              className="appearance-none h-11 pl-9 pr-8 text-sm border border-border-gray bg-white text-mid-navy outline-none cursor-pointer transition-all min-w-[150px]"
            >
              {sortOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-3 text-gray-text/50 pointer-events-none" />
          </div>

          <span className="ml-auto text-sm text-soft-navy font-medium whitespace-nowrap">
            {isCategoryPage ? (
              `${paginatedCount || 0} of ${totalArticles} articles`
            ) : (
              `${totalArticles} articles`
            )}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function BlogFilters(props: BlogFiltersProps) {
  return (
    <Suspense fallback={null}>
      <BlogFiltersInner {...props} />
    </Suspense>
  );
}