import Image from 'next/image';
import Link from 'next/link';
import { Article, Offer } from '@/types';
import { cn } from '@/lib/utils';

interface CompactArticleCardProps {
  article: Article;
  className?: string;
}

export function CompactArticleCard({ article, className }: CompactArticleCardProps) {
  return (
    <Link
      href={`/blog/${article.slug}`}
      className={cn(
        "group block bg-white border border-border-gray/50 rounded-xl overflow-hidden hover:shadow-md hover:border-yellow/50 transition-all duration-300 flex flex-col h-full",
        className
      )}
    >
      {/* Image Container */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-light-gray shrink-0">
        <Image
          src={article.cover_image || 'https://picsum.photos/seed/placeholder/400/300'}
          alt={article.title}
          fill
          referrerPolicy="no-referrer"
          className="object-cover group-hover:scale-105 transition-transform duration-500"
          sizes="(max-width: 640px) 50vw, 300px"
        />
        <div className="absolute inset-0 bg-navy/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
      </div>

      {/* Content */}
      <div className="p-3 flex flex-col flex-1 justify-between bg-white">
        <h4 className="font-bold text-navy text-xs sm:text-sm leading-snug line-clamp-2 group-hover:text-yellow-hover transition-colors">
          {article.title}
        </h4>
        <span className="text-[10px] font-extrabold text-navy/40 uppercase tracking-wider mt-1.5 block">
          {article.category?.name || ''}
        </span>
      </div>
    </Link>
  );
}

interface CompactOfferCardProps {
  offer: Offer;
  className?: string;
}

export function CompactOfferCard({ offer, className }: CompactOfferCardProps) {
  return (
    <Link
      href={`/offers/${offer.slug}`}
      className={cn(
        "group block bg-white border border-border-gray/50 rounded-xl overflow-hidden hover:shadow-md hover:border-yellow/50 transition-all duration-300 flex flex-col h-full",
        className
      )}
    >
      {/* Image Container */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-light-gray shrink-0">
        <Image
          src={offer.cover_image || 'https://picsum.photos/seed/placeholder/400/300'}
          alt={offer.title}
          fill
          referrerPolicy="no-referrer"
          className="object-cover group-hover:scale-105 transition-transform duration-500"
          sizes="(max-width: 640px) 50vw, 300px"
        />
        {offer.payout_amount && (
          <span className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-yellow text-navy text-[9px] font-black rounded shadow-sm">
            {offer.payout_amount}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-3 flex flex-col flex-1 justify-between bg-white">
        <h4 className="font-bold text-navy text-xs sm:text-sm leading-snug line-clamp-2 group-hover:text-yellow-hover transition-colors">
          {offer.title}
        </h4>
        <span className="text-[10px] font-extrabold text-navy/40 uppercase tracking-wider mt-1.5 block">
          {(offer.type || '').replace(/-/g, ' ')}
        </span>
      </div>
    </Link>
  );
}
