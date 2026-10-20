import Image from 'next/image';
import Link from 'next/link';
import { Clock, Calendar, ArrowRight, Eye } from 'lucide-react';
import { Article } from '@/types';
import { cn, formatDate } from '@/lib/utils';

interface BlogCardProps {
  article: Article;
  className?: string;
}

// ✅ Format number: 1000 → 1k, 10000 → 10k, 19200 → 19.2k, 1000000 → 1M
const formatViews = (views: number): string => {
  if (views >= 1000000) {
    return (views / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (views >= 1000) {
    return (views / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  }
  return String(views);
};

export default function BlogCard({ article, className }: BlogCardProps) {
  // ✅ SAFE: Check if article exists first
  if (!article) {
    return null;
  }

  // ✅ Get category from database - safe with optional chaining
  const categoryName = article?.category?.name || article?.category_name || null;
  const categorySlug = article?.category?.slug || article?.category_slug || null;

  // ✅ Check if category exists
  const showCategory = categoryName !== null && categoryName !== '';

  return (
    <Link
      href={`/blog/${article.slug}`}
      className={cn(
        'group bg-white border border-border-gray shadow-card hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col cursor-pointer',
        className
      )}
    >
      {/* Image */}
      <div className="relative aspect-[16/10] overflow-hidden bg-light-gray">
        <Image
          src={article.cover_image || 'https://picsum.photos/seed/placeholder/800/500'}
          alt={article.title}
          fill
          referrerPolicy="no-referrer"
          className="object-cover group-hover:scale-105 transition-transform duration-500"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        
        {/* ✅ Category badge - only if category exists */}
        {showCategory && categorySlug ? (
          <Link
            href={`/blog/category/${categorySlug}`}
            className="absolute top-3 left-3 px-3 py-1 text-xs font-medium uppercase tracking-wider border border-yellow/30 bg-navy text-yellow"
          >
            {categoryName}
          </Link>
        ) : showCategory ? (
          <span className="absolute top-3 left-3 px-3 py-1 text-xs font-medium uppercase tracking-wider border border-yellow/30 bg-navy text-yellow">
            {categoryName}
          </span>
        ) : null}
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-1">
        <h3 className="font-bold text-navy text-lg leading-tight line-clamp-2 group-hover:text-yellow transition-colors">
          {article.title}
        </h3>
        <p className="mt-2 text-sm text-gray-text line-clamp-2 flex-1">
          {article.description}
        </p>

        {/* Meta */}
        <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-gray-text">
          {article.read_time && (
            <span className="flex items-center gap-1">
              <Clock size={14} />
              {article.read_time} min read
            </span>
          )}
          <span className="flex items-center gap-1">
            <Calendar size={14} />
            {formatDate(article.created_at)}
          </span>
          {article.views > 0 && (
            <span className="flex items-center gap-1">
              <Eye size={14} />
              {formatViews(article.views)}
            </span>
          )}
        </div>

        {/* CTA */}
        <div className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 bg-navy text-white text-sm font-semibold hover:bg-mid-navy hover:gap-3 transition-all duration-300 w-fit group-hover:shadow-md">
          Read More
          <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
        </div>
      </div>
    </Link>
  );
}