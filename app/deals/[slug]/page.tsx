import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  Star, ExternalLink, ChevronRight, ShieldCheck, ArrowLeft, Eye, Globe,
  MessageSquare, Calendar, Tag as TagIcon, TrendingUp,
} from 'lucide-react';
import { getDealBySlug, getAllDeals, getReviewsByDealId } from '@/lib/queries';
import DealCard from '@/components/ui/DealCard';
import Reviews from '@/components/ui/Reviews';
import { formatDate, formatNumberAbbreviated } from '@/lib/utils';
import AdPlacement from '@/components/ui/AdPlacement';
import AdSense from '@/components/ui/GoogleAdSense';
import parse from 'html-react-parser';
import DealClickTracker from '@/components/ui/DealClickTracker';
import AuthorSection from './AuthorSection';
import Flag from '@/components/ui/Flag';
import { Countries } from 'countries-states-cities-service/countries';

const ALL_COUNTRIES = Countries.getCountries();

export const revalidate = 3600;

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ from?: string }>;
}

export async function generateStaticParams() {
  const deals = await getAllDeals();
  return deals.map((d) => ({ slug: d.slug }));
}


export default async function DealDetailPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const sp = await searchParams;
  const from = sp.from || 'deals';

  const deal = await getDealBySlug(slug);
  if (!deal) notFound();

  const allDeals = await getAllDeals();
  const initialReviews = await getReviewsByDealId(deal.id);

  const relatedDeals = allDeals
    .filter((d) => d.id !== deal.id)
    .slice(0, 3);

  const withdrawMethods = deal.withdraw_method
    ? deal.withdraw_method.split(',').map((m) => m.trim())
    : [];

  const getCountryCodes = (): string[] => {
    if (!deal.country) return [];
    if (Array.isArray(deal.country)) return deal.country;
    return deal.country.split(',').filter(Boolean);
  };
  const countryCodes = getCountryCodes();

  const authorId = deal.author_id;
  const authorName = deal.author_name || 'EarnMoney Team';
  const authorPicture = deal.author_picture || null;
  const authorBio = deal.author_bio || null;

  const categoryName = deal.category?.name || deal.category_name || null;
  const categorySlug = deal.category?.slug || deal.category_slug || null;

  // Resolve payout label from pay_name
  const payLabel = deal.pay_name?.trim() || 'Deal Value';

  const content = deal.content || '';

  const insertAdsIntoContent = (html: string) => {
    if (!html) return '';
    const headingRegex = /(<h2[^>]*>.*?<\/h2>|<h3[^>]*>.*?<\/h3>)/gi;
    const headings = html.match(headingRegex) || [];
    if (headings.length === 0) {
      const paragraphs = html.split('</p>');
      const totalP = paragraphs.length;
      if (totalP < 3) return html + '<div class="my-8 ad-placeholder-1"></div>';
      const partSize = Math.floor(totalP / 3);
      let result = '';
      let adCount = 0;
      for (let i = 0; i < paragraphs.length; i++) {
        result += paragraphs[i];
        if (i < paragraphs.length - 1) result += '</p>';
        if (i === partSize && adCount === 0) {
          result += '<div class="my-8 ad-placeholder-1"></div>';
          adCount++;
        } else if (i === partSize * 2 && adCount === 1) {
          result += '<div class="my-8 ad-placeholder-2"></div>';
          adCount++;
        }
      }
      return result;
    }
    const totalHeadings = headings.length;
    let ad1Position = 0;
    let ad2Position = 0;
    if (totalHeadings >= 3) { ad1Position = 1; ad2Position = 3; }
    else if (totalHeadings === 2) { ad1Position = 1; ad2Position = 2; }
    else { ad1Position = 1; ad2Position = 1; }
    let result = '';
    let headingIndex = 0;
    let adCount = 0;
    const allParts = html.split(headingRegex);
    for (let i = 0; i < allParts.length; i++) {
      const part = allParts[i];
      if (part && (part.startsWith('<h2') || part.startsWith('<h3'))) {
        headingIndex++;
        result += part;
        if (headingIndex === ad1Position && adCount === 0) {
          result += '<div class="my-8 ad-placeholder-1"></div>';
          adCount++;
        } else if (headingIndex === ad2Position && adCount === 1 && ad1Position !== ad2Position) {
          result += '<div class="my-8 ad-placeholder-2"></div>';
          adCount++;
        }
      } else {
        result += part;
      }
    }
    if (adCount === 1) result += '<div class="my-8 ad-placeholder-2"></div>';
    if (adCount === 0) result += '<div class="my-8 ad-placeholder-1"></div><div class="my-8 ad-placeholder-2"></div>';
    return result;
  };

  const contentWithAds = insertAdsIntoContent(content);

  const backLink = from === 'category' && categorySlug
    ? `/deals/category/${categorySlug}`
    : '/deals';
  const backLabel = from === 'category' && categoryName
    ? `Back to ${categoryName}`
    : 'Back to Deals';

  return (
    <div className="bg-white min-h-screen">

      {/* ============================================================ */}
      {/* HERO — same layout as offers */}
      {/* ============================================================ */}
      <section className="relative overflow-hidden bg-navy">
        {deal.cover_image && (
          <div className="absolute inset-0 z-0">
            <Image
              src={deal.cover_image}
              alt={deal.title}
              fill
              priority
              className="object-cover opacity-30 scale-105"
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-navy/80 via-navy/90 to-navy" />
            <div className="absolute inset-0 bg-gradient-to-r from-navy/80 to-transparent" />
          </div>
        )}
        <div aria-hidden className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-yellow/10 blur-[120px] pointer-events-none z-0" />

        {/* Breadcrumb */}
        <div className="relative z-30 max-w-container mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <nav className="flex items-center gap-2 text-xs sm:text-sm text-white/60">
              <Link href="/" className="hover:text-yellow transition-colors">Home</Link>
              <ChevronRight size={12} className="text-white/30" />
              <Link href="/deals" className="hover:text-yellow transition-colors">Deals</Link>
              {from === 'category' && categoryName && categorySlug && (
                <>
                  <ChevronRight size={12} className="text-white/30" />
                  <Link href={`/deals/category/${categorySlug}`} className="hover:text-yellow transition-colors">
                    {categoryName}
                  </Link>
                </>
              )}
              <ChevronRight size={12} className="text-white/30" />
              <span className="text-white/90 font-medium line-clamp-1 max-w-[180px]">{deal.title}</span>
            </nav>

            <Link
              href={backLink}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-white/80 hover:text-yellow transition-colors border border-white/20 hover:border-yellow/40 px-3 py-1.5 bg-white/5 backdrop-blur-sm"
            >
              <ArrowLeft size={13} /> {backLabel}
            </Link>
          </div>
        </div>

        {/* Hero body */}
        <div className="relative z-20 max-w-container mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-16 sm:pt-20 sm:pb-24">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-2 mb-5">
              {categoryName ? (
                <Link
                  href={`/deals/category/${categorySlug}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-yellow/10 text-yellow text-[11px] font-black uppercase tracking-wider border border-yellow/40 hover:bg-yellow hover:text-navy transition-colors"
                >
                  <TagIcon size={11} /> {categoryName}
                </Link>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-yellow/10 text-yellow text-[11px] font-black uppercase tracking-wider border border-yellow/40">
                  <TagIcon size={11} /> Deal
                </span>
              )}
              {deal.is_boosted === 1 && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 text-white text-[11px] font-black uppercase tracking-wider border border-white/20">
                  <TrendingUp size={11} /> Featured
                </span>
              )}
              {deal.rating && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 text-white text-[11px] font-black uppercase tracking-wider border border-white/20">
                  <Star size={11} className="fill-yellow text-yellow" /> {deal.rating} / 5
                </span>
              )}
            </div>

            {deal.brand_name && (
              <div className="mb-2">
                <span className="text-xs font-black uppercase tracking-[0.2em] text-yellow/90">
                  {deal.brand_name}
                </span>
              </div>
            )}

            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white leading-[1.05] tracking-tight">
              {deal.title}
            </h1>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-6 text-white/70 text-sm">
              <span className="flex items-center gap-1.5">
                <ShieldCheck size={15} className="text-yellow" />
                Verified Deal
              </span>
              {deal.verified_date && (
                <span className="flex items-center gap-1.5">
                  <Calendar size={14} className="text-yellow/80" />
                  Verified {formatDate(deal.verified_date)}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Eye size={14} className="text-yellow/80" />
                {formatNumberAbbreviated(deal.views || 0)} views
              </span>
            </div>

            <div className="mt-8">
              <DealClickTracker
                dealLink={deal.offer_link}
                slug={slug}
                className="inline-flex items-center gap-2 px-7 py-3.5 bg-yellow text-navy font-black text-sm uppercase tracking-wider border-2 border-yellow hover:bg-white hover:border-white transition-all shadow-xl"
              >
                Claim Deal <ExternalLink size={16} />
              </DealClickTracker>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* MAIN CONTENT */}
      {/* ============================================================ */}
      <section className="py-12 sm:py-16 bg-light-gray/40">
        <div className="max-w-container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">

            {/* Main Column */}
            <div className="lg:col-span-8 space-y-8">
              <article className="bg-white border border-border-gray/50 shadow-sm">
                <div className="px-6 sm:px-10 pt-6 sm:pt-10">
                  <AdPlacement placement="offer-content" />
                </div>

                {deal.content && (
                  <div className="px-6 sm:px-10 py-8">
                    <div className="article-body-custom leading-relaxed text-gray-text
                      [&_p]:text-base [&_p]:sm:text-[17px] [&_p]:text-gray-text [&_p]:leading-relaxed [&_p]:mb-6
                      [&_p_strong]:text-navy [&_p_strong]:font-extrabold
                      [&_blockquote]:border-l-4 [&_blockquote]:border-yellow [&_blockquote]:bg-light-gray/60 [&_blockquote]:pl-6 [&_blockquote]:pr-4 [&_blockquote]:py-4 [&_blockquote]:italic [&_blockquote]:my-8 [&_blockquote]:text-navy/90 [&_blockquote]:border-r [&_blockquote]:border-yellow/30 [&_blockquote_p]:text-lg [&_blockquote_p]:font-serif [&_blockquote_p]:mb-0
                      [&_h1]:text-2xl [&_h1]:sm:text-3xl [&_h1]:font-black [&_h1]:text-navy [&_h1]:mt-12 [&_h1]:mb-6 [&_h1]:tracking-tight [&_h1]:border-b [&_h1]:border-border-gray/60 [&_h1]:pb-3
                      [&_h2]:text-xl [&_h2]:sm:text-2xl [&_h2]:font-extrabold [&_h2]:text-navy [&_h2]:mt-10 [&_h2]:mb-4 [&_h2]:tracking-tight [&_h2]:flex [&_h2]:items-center [&_h2]:gap-3 [&_h2]:before:content-[''] [&_h2]:before:w-2 [&_h2]:before:h-8 [&_h2]:before:bg-yellow
                      [&_h3]:text-lg [&_h3]:font-bold [&_h3]:text-navy [&_h3]:mt-8 [&_h3]:mb-3 [&_h3]:border-l-4 [&_h3]:border-yellow [&_h3]:pl-3
                      [&_ul]:list-none [&_ul]:pl-0 [&_ul]:mb-8 [&_ul]:space-y-2.5
                      [&_ul_li]:relative [&_ul_li]:pl-8 [&_ul_li]:mb-2.5 [&_ul_li]:text-sm [&_ul_li]:sm:text-base [&_ul_li]:text-gray-text [&_ul_li]:before:content-['✓'] [&_ul_li]:before:absolute [&_ul_li]:before:left-0 [&_ul_li]:before:top-0.5 [&_ul_li]:before:text-emerald-600 [&_ul_li]:before:font-extrabold [&_ul_li]:before:bg-emerald-50 [&_ul_li]:before:px-1.5 [&_ul_li]:before:py-0.5 [&_ul_li]:before:border [&_ul_li]:before:border-emerald-200 [&_ul_li]:before:text-[10px]
                      [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-8 [&_ol]:space-y-2.5
                      [&_ol_li]:mb-2 [&_ol_li]:text-sm [&_ol_li]:sm:text-base [&_ol_li]:text-gray-text [&_ol_li]:font-semibold [&_ol_li_strong]:text-navy
                      [&_table]:w-full [&_table]:my-10 [&_table]:border-collapse [&_table]:border [&_table]:border-border-gray/70 [&_table]:shadow-md
                      [&_thead]:bg-navy [&_thead]:text-white
                      [&_th]:px-5 [&_th]:py-4 [&_th]:text-left [&_th]:text-xs [&_th]:font-black [&_th]:uppercase [&_th]:tracking-wider [&_th]:text-white
                      [&_tr]:border-b [&_tr]:border-border-gray/30 [&_tr:last-child]:border-0 [&_tr]:hover:bg-light-gray/20 [&_tr]:transition-colors
                      [&_tr:nth-child(even)]:bg-light-gray/35
                      [&_td]:px-5 [&_td]:py-4 [&_td]:text-sm [&_td]:sm:text-base [&_td]:text-gray-text [&_td]:font-semibold
                      [&_code]:bg-light-gray [&_code]:text-pink-600 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:border [&_code]:border-border-gray/45 [&_code]:font-mono [&_code]:text-xs
                      [&_pre]:bg-navy/95 [&_pre]:text-yellow/90 [&_pre]:p-5 [&_pre]:font-mono [&_pre]:text-xs [&_pre]:sm:text-sm [&_pre]:my-8 [&_pre]:overflow-x-auto [&_pre]:shadow-lg [&_pre]:border [&_pre]:border-white/10 [&_pre]:leading-relaxed [&_pre_code]:text-yellow-hover [&_pre_code]:border-0 [&_pre_code]:p-0 [&_pre_code]:bg-transparent"
                    >
                      {parse(contentWithAds, {
                        replace: (node: any) => {
                          if (node.type === 'tag' && node.name === 'div' && node.attribs?.class?.includes('ad-placeholder-1')) {
                            return <div className="my-8"><AdSense placement="in_content_middle" /></div>;
                          }
                          if (node.type === 'tag' && node.name === 'div' && node.attribs?.class?.includes('ad-placeholder-2')) {
                            return <div className="my-8"><AdSense placement="in_content_bottom" /></div>;
                          }
                          return node;
                        },
                      })}
                    </div>
                  </div>
                )}

                <div className="px-6 sm:px-10 pb-6">
                  <AdSense placement="offer_bottom" />
                </div>

                <div className="px-6 sm:px-10 pb-10">
                  <AuthorSection
                    authorId={authorId}
                    authorName={authorName}
                    authorPicture={authorPicture}
                    authorBio={authorBio}
                    createdAt={deal.created_at}
                  />
                  <Reviews dealId={deal.id} initialReviews={initialReviews} />
                </div>

                <div className="px-6 sm:px-10 py-6 border-t border-border-gray/30">
                  <AdPlacement placement="offer-content" />
                </div>
              </article>
            </div>

            {/* Sidebar */}
            <aside className="lg:col-span-4">
              <div className="sticky top-24 space-y-5">

                <div className="bg-white border border-border-gray shadow-sm overflow-hidden">
                  <div className="bg-navy px-6 py-4 border-b-4 border-yellow">
                    <h3 className="text-sm font-black uppercase tracking-widest text-white">
                      Deal Overview
                    </h3>
                  </div>

                  <div className="p-6 space-y-5">
                    {categoryName && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-gray-text">Category</span>
                        <Link
                          href={`/deals/category/${categorySlug}`}
                          className="text-sm font-bold text-navy hover:text-yellow transition-colors"
                        >
                          {categoryName}
                        </Link>
                      </div>
                    )}

                    <div className="border-t border-border-gray/40 pt-5">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold uppercase tracking-wider text-navy">
                          Available In
                        </span>
                        <span className="text-[10px] font-black uppercase tracking-wider text-navy/60 bg-light-gray border border-border-gray/50 px-2 py-0.5">
                          {countryCodes.length > 0
                            ? `${countryCodes.length} ${countryCodes.length === 1 ? 'Country' : 'Countries'}`
                            : 'Global'}
                        </span>
                      </div>

                      {countryCodes.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {countryCodes.map((code) => {
                            const country = ALL_COUNTRIES.find((c) => c.iso2 === code);
                            return (
                              <div
                                key={code}
                                className="group flex items-center gap-2 bg-light-gray/80 hover:bg-white border border-border-gray/70 hover:border-navy/40 px-2 py-1.5 shadow-sm transition-all cursor-default select-none"
                                title={country?.name || code}
                              >
                                <div className="relative w-6 h-6 rounded-full overflow-hidden shrink-0 border border-black/15 shadow-inner flex items-center justify-center bg-slate-200">
                                  <span className="absolute inset-0 flex items-center justify-center [&_svg]:w-full [&_svg]:h-full [&_svg]:max-w-none [&_svg]:max-h-none [&_svg]:scale-[1.85] [&_img]:w-full [&_img]:h-full [&_img]:max-w-none [&_img]:max-h-none [&_img]:scale-[1.85] [&_img]:object-cover">
                                    <Flag country={code as any} />
                                  </span>
                                </div>
                                <span className="text-[11px] font-bold text-navy tracking-tight">
                                  {country?.name === 'United States' ? 'USA' : country?.name || code}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-light-gray border border-border-gray text-xs font-bold text-navy">
                          <Globe size={14} className="text-navy" />
                          Global Availability
                        </div>
                      )}
                    </div>

                    {deal.payout_amount && (
                      <div className="flex items-center justify-between gap-3 bg-navy px-3.5 py-2.5 border-l-4 border-yellow">
                        <span className="text-[10px] font-black uppercase tracking-[0.12em] text-yellow leading-tight">
                          {payLabel}
                        </span>
                        <span className="text-xl font-black text-white leading-none tracking-tight whitespace-nowrap">
                          {deal.payout_amount}
                        </span>
                      </div>
                    )}

                    <div className="border-t border-border-gray/40 pt-5 space-y-3">
                      {deal.rating && (
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold uppercase tracking-wider text-gray-text">Safety Score</span>
                          <span className="text-sm font-bold text-navy flex items-center gap-1">
                            <Star size={14} className="fill-yellow text-yellow" /> {deal.rating} / 5
                          </span>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-gray-text">Verified</span>
                        <span className="text-sm font-bold text-navy">{formatDate(deal.verified_date || deal.created_at)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-gray-text">Views</span>
                        <span className="text-sm font-bold text-navy flex items-center gap-1.5">
                          <Eye size={14} className="text-navy" />
                          {formatNumberAbbreviated(deal.views || 0)}
                        </span>
                      </div>
                    </div>

                    <DealClickTracker
                      dealLink={deal.offer_link}
                      slug={slug}
                      className="flex items-center justify-center gap-2 w-full py-3.5 bg-yellow text-navy font-black text-sm uppercase tracking-wider border-2 border-yellow hover:bg-white hover:border-navy transition-all shadow-sm cursor-pointer"
                    >
                      Claim Deal <ExternalLink size={16} />
                    </DealClickTracker>
                  </div>
                </div>

                {withdrawMethods.length > 0 && (
                  <div className="bg-white border border-border-gray shadow-sm overflow-hidden">
                    <div className="bg-navy px-6 py-3 border-b-4 border-yellow">
                      <h3 className="text-sm font-black uppercase tracking-widest text-white">Redemption</h3>
                    </div>
                    <div className="p-6">
                      <div className="flex flex-wrap gap-2">
                        {withdrawMethods.map((method, i) => (
                          <span
                            key={i}
                            className="px-3 py-1.5 bg-light-gray text-navy text-xs font-bold border border-border-gray/70"
                          >
                            {method}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                <AdPlacement placement="sidebar" />
                <AdSense placement="sidebar" />

              </div>
            </aside>

          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* RELATED DEALS */}
      {/* ============================================================ */}
      {relatedDeals.length > 0 && (
        <section className="bg-white py-20 border-t border-border-gray/30">
          <div className="max-w-container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between mb-10">
              <div>
                <span className="inline-block text-xs font-black uppercase tracking-[0.2em] text-yellow mb-2">
                  More Like This
                </span>
                <h2 className="text-3xl sm:text-4xl font-black text-navy tracking-tight uppercase">
                  Similar Deals
                </h2>
              </div>
              <Link
                href="/deals"
                className="hidden sm:inline-flex items-center gap-1.5 text-sm font-bold text-navy hover:text-yellow transition-colors"
              >
                View All <ChevronRight size={16} />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedDeals.map((d) => (
                <DealCard key={d.id} deal={d} />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}