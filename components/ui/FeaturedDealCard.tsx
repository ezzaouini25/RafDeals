import Image from 'next/image';
import Link from 'next/link';
import { Star, ExternalLink, ShieldCheck, Globe } from 'lucide-react';
import { Offer } from '@/types';
import { cn } from '@/lib/utils';
import Flag from '@/components/ui/Flag';
import { Countries } from 'countries-states-cities-service/countries';

const ALL_COUNTRIES = Countries.getCountries();

interface FeaturedDealCardProps {
  deal: Offer & {
    category_name?: string | null;
    verified_date?: string | null;
  };
  className?: string;
}

export default function FeaturedDealCard({
  deal,
  className,
}: FeaturedDealCardProps) {
  if (!deal) return null;

  const getPlainText = (html: string) => {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  };

  const getShortDescription = () => {
    if (!deal.content) return 'No description available';
    const plainText = getPlainText(deal.content);
    return plainText.length > 100
      ? plainText.substring(0, 100) + '...'
      : plainText;
  };

  const categoryDisplay = deal.category_name || (deal as any).category?.name || null;

  const getVerifiedDisplay = (): string | null => {
    const raw = deal.verified_date;
    if (!raw) return null;
    try {
      const d = new Date(raw);
      if (isNaN(d.getTime())) return null;
      return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    } catch {
      return null;
    }
  };

  const verifiedDisplay = getVerifiedDisplay();

  const getRatingValue = (): number => {
    if (deal.rating === null || deal.rating === undefined) return 0;
    const num = Number(deal.rating);
    return isNaN(num) ? 0 : Math.min(Math.max(num, 0), 5);
  };

  const ratingVal = getRatingValue();
  const ratingDisplay = ratingVal > 0 ? ratingVal.toFixed(1) : null;

  const getCountryCodes = (): string[] => {
    if (!deal.country) return [];
    if (Array.isArray(deal.country)) return deal.country;
    return deal.country.split(',').filter(Boolean);
  };

  const countryCodes = getCountryCodes();
  const visibleCountries = countryCodes.slice(0, 3);
  const remainingCount = countryCodes.length - visibleCountries.length;

  return (
    <div
      className={cn(
        'group bg-white border border-gray-400 shadow-card hover:shadow-card-hover transition-all duration-200 overflow-hidden flex flex-col rounded-none relative',
        className
      )}
    >
      {/* Top Image & Header Overlays */}
      <div className="relative aspect-[16/9] overflow-hidden bg-light-gray">
        <Image
          src={deal.cover_image || 'https://picsum.photos/seed/placeholder/800/500'}
          alt={deal.title}
          fill
          referrerPolicy="no-referrer"
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />

        {/* Category Badge - Top Left */}
        {categoryDisplay && (
          <span className="absolute top-2.5 left-2.5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-navy text-yellow">
            {categoryDisplay}
          </span>
        )}

        {/* Boosted / Featured Ribbon - Top Right */}
        {deal.is_boosted === 1 && (
          <span className="absolute top-2.5 right-2.5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-yellow text-navy">
            ★ Featured
          </span>
        )}
      </div>

      {/* Structured Content Grid Placement */}
      <div className="p-4 flex flex-col flex-1 justify-between">
        <div>
          {/* Metadata Row (Verification & Rating) */}
          <div className="flex items-center justify-between gap-2 mb-3 text-xs">
            {verifiedDisplay ? (
              <span className="inline-flex items-center gap-1 text-emerald-700 font-medium text-[11px]">
                <ShieldCheck size={13} />
                <span>Verified {verifiedDisplay}</span>
              </span>
            ) : (
              <span className="text-gray-400 text-[11px]">Unverified</span>
            )}

            {ratingDisplay ? (
              <div className="flex items-center gap-1.5 bg-light-gray px-2 py-1">
                <div className="flex text-yellow">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={12}
                      className={cn(
                        i < Math.floor(ratingVal) ? 'fill-yellow text-yellow' : 'text-gray-300'
                      )}
                    />
                  ))}
                </div>
                <span className="font-bold text-navy text-xs">
                  {ratingDisplay}<span className="text-gray-400 font-normal"> / 5</span>
                </span>
              </div>
            ) : (
              <span className="text-[11px] text-gray-400 bg-light-gray px-2 py-1">No rating</span>
            )}
          </div>

          {/* ✅ Country Flags / Global Indicator */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            {visibleCountries.length > 0 ? (
              <>
                <div className="flex -space-x-2">
                  {visibleCountries.map((code) => (
                    <div
                      key={code}
                      className="w-6 h-6 rounded-full overflow-hidden border-2 border-white shadow-sm bg-gray-100 flex items-center justify-center relative"
                      title={ALL_COUNTRIES.find((c) => c.iso2 === code)?.name || code}
                    >
                      <div className="absolute inset-0 flex items-center justify-center" style={{ transform: 'scale(1.4)' }}>
                        <Flag country={code as any} width={24} />
                      </div>
                    </div>
                  ))}
                  {remainingCount > 0 && (
                    <div
                      className="w-6 h-6 rounded-full border-2 border-white bg-gray-200 text-gray-600 text-[10px] font-bold flex items-center justify-center shadow-sm z-10"
                      title={`${remainingCount} more countries`}
                    >
                      +{remainingCount}
                    </div>
                  )}
                </div>
                <span className="text-[10px] text-gray-500 font-medium">
                  {countryCodes.length} {countryCodes.length === 1 ? 'Country' : 'Countries'}
                </span>
              </>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                <Globe size={14} className="text-navy" />
                Global
              </span>
            )}
          </div>

          {/* Title */}
          <Link href={`/deals/${deal.slug}`}>
            <h3 className="font-bold text-navy text-base leading-snug line-clamp-2 group-hover:text-yellow-hover transition-colors">
              {deal.title}
            </h3>
          </Link>

          {/* Short Description */}
          <p className="mt-1.5 text-xs text-gray-text line-clamp-2 leading-relaxed">
            {getShortDescription()}
          </p>
        </div>

        {/* Bottom Payout & Expanded Prominent Button Row */}
        <div className="mt-5 pt-3.5 border-t border-border-gray flex items-center justify-between gap-4">
          <div>
            <span className="text-[10px] uppercase text-gray-400 block font-medium">Payout</span>
            <span className="text-xs font-bold text-navy">
              {deal.payout_amount || 'Check Details'}
            </span>
          </div>

          <Link
            href={`/deals/${deal.slug}`}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-yellow text-navy text-xs font-bold tracking-wide uppercase hover:bg-yellow-hover transition-colors shadow-sm"
          >
            View Deal
            <ExternalLink size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}