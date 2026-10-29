import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  Star, ExternalLink, ChevronRight, ShieldCheck, ArrowLeft, Eye, Globe,
  MessageSquare, Calendar, Tag as TagIcon, TrendingUp,
} from 'lucide-react';
import { getOfferBySlug, getAllOffers, getReviewsByOfferId } from '@/lib/queries';
import OfferCard from '@/components/ui/OfferCard';
import Reviews from '@/components/ui/Reviews';
import { formatDate, formatNumberAbbreviated } from '@/lib/utils';
import AdPlacement from '@/components/ui/AdPlacement';
import AdSense from '@/components/ui/GoogleAdSense';
import parse, { domToReact } from 'html-react-parser';
import OfferClickTracker from '@/components/ui/OfferClickTracker';
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
  const offers = await getAllOffers();
  return offers.map((o) => ({ slug: o.slug }));
}

export default async function OfferDetailPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const sp = await searchParams;
  const from = sp.from || 'offers';

  const offer = await getOfferBySlug(slug);
  if (!offer) notFound();

  const allOffers = await getAllOffers();
  const initialReviews = await getReviewsByOfferId(offer.id);

  const relatedOffers = allOffers
    .filter((o) => o.id !== offer.id && o.type === offer.type)
    .slice(0, 3);

  const withdrawMethods = offer.withdraw_method
    ? offer.withdraw_method.split(',').map((m) => m.trim())
    : [];

  const getCountryCodes = (): string[] => {
    if (!offer.country) return [];
    if (Array.isArray(offer.country)) return offer.country;
    return offer.country.split(',').filter(Boolean);
  };
  const countryCodes = getCountryCodes();

  const authorId = offer.author_id;
  const authorName = offer.author_name || 'EarnMoney Team';
  const authorPicture = offer.author_picture || null;
  const authorBio = offer.author_bio || null;

  const categoryName = offer.category?.name || offer.category_name || null;
  const categorySlug = offer.category?.slug || offer.category_slug || null;

  const payLabel = offer.pay_name?.trim() || 'Offer Value';

  const content = offer.content || '';

  const insertAdsIntoContent = (html: string) => {
    if (!html) return '';

    const headingRegex = /(<h2[^>]*>.*?<\/h2>|<h3[^>]*>.*?<\/h3>)/gi;
    const headings = html.match(headingRegex) || [];

    if (headings.length === 0) {
      const paragraphs = html.split('</p>');
      const totalP = paragraphs.length;
      if (totalP < 3) {
        return html + '<div class="my-8 ad-placeholder-1"></div>';
      }
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
    ? `/offers/category/${categorySlug}`
    : '/offers';
  const backLabel = from === 'category' && categoryName
    ? `Back to ${categoryName}`
    : 'Back to Offers';

  return (
    <div className="bg-white min-h-screen">

      {/* HERO */}
      <section className="relative overflow-hidden bg-navy">
        {offer.cover_image && (
          <div className="absolute inset-0 z-0">
            <Image
              src={offer.cover_image}
              alt={offer.title}
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

        <div className="relative z-30 max-w-container mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <nav className="flex items-center gap-2 text-xs sm:text-sm text-white/60">
              <Link href="/" className="hover:text-yellow transition-colors">Home</Link>
              <ChevronRight size={12} className="text-white/30" />
              <Link href="/offers" className="hover:text-yellow transition-colors">Offers</Link>
              {from === 'category' && categoryName && categorySlug && (
                <>
                  <ChevronRight size={12} className="text-white/30" />
                  <Link href={`/offers/category/${categorySlug}`} className="hover:text-yellow transition-colors">
                    {categoryName}
                  </Link>
                </>
              )}
              <ChevronRight size={12} className="text-white/30" />
              <span className="text-white/90 font-medium line-clamp-1 max-w-[180px]">{offer.title}</span>
            </nav>

            <Link
              href={backLink}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-white/80 hover:text-yellow transition-colors border border-white/20 hover:border-yellow/40 px-3 py-1.5 bg-white/5 backdrop-blur-sm"
            >
              <ArrowLeft size={13} /> {backLabel}
            </Link>
          </div>
        </div>

        <div className="relative z-20 max-w-container mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-16 sm:pt-20 sm:pb-24">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-2 mb-5">
              {categoryName ? (
                <Link
                  href={`/offers/category/${categorySlug}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-yellow/10 text-yellow text-[11px] font-black uppercase tracking-wider border border-yellow/40 hover:bg-yellow hover:text-navy transition-colors"
                >
                  <TagIcon size={11} /> {categoryName}
                </Link>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-yellow/10 text-yellow text-[11px] font-black uppercase tracking-wider border border-yellow/40">
                  <TagIcon size={11} /> {offer.type?.replace(/-/g, ' ') || 'Offer'}
                </span>
              )}
              {offer.is_boosted === 1 && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 text-white text-[11px] font-black uppercase tracking-wider border border-white/20">
                  <TrendingUp size={11} /> Featured
                </span>
              )}
              {offer.rating && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 text-white text-[11px] font-black uppercase tracking-wider border border-white/20">
                  <Star size={11} className="fill-yellow text-yellow" /> {offer.rating} / 5
                </span>
              )}
            </div>

            {offer.brand_name && (
              <div className="mb-2">
                <span className="text-xs font-black uppercase tracking-[0.2em] text-yellow/90">
                  {offer.brand_name}
                </span>
              </div>
            )}

            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white leading-[1.05] tracking-tight">
              {offer.title}
            </h1>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-6 text-white/70 text-sm">
              <span className="flex items-center gap-1.5">
                <ShieldCheck size={15} className="text-yellow" />
                Verified Offer
              </span>
              {offer.verified_date && (
                <span className="flex items-center gap-1.5">
                  <Calendar size={14} className="text-yellow/80" />
                  Verified {formatDate(offer.verified_date)}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Eye size={14} className="text-yellow/80" />
                {formatNumberAbbreviated(offer.views || 0)} views
              </span>
            </div>

            <div className="mt-8">
              <OfferClickTracker
                offerLink={offer.offer_link}
                slug={slug}
                className="inline-flex items-center gap-2 px-7 py-3.5 bg-yellow text-navy font-black text-sm uppercase tracking-wider border-2 border-yellow hover:bg-white hover:border-white transition-all shadow-xl"
              >
                Visit Offer <ExternalLink size={16} />
              </OfferClickTracker>
            </div>
          </div>
        </div>
      </section>

      {/* MAIN CONTENT */}
      <section className="py-12 sm:py-16 bg-light-gray/40">
        <div className="max-w-container mx-auto px-4 sm:px-6 lg:px-8">

          {/* MOBILE ONLY — Offer Overview above article */}
          <div className="lg:hidden mb-8">
            <div className="bg-white border border-border-gray shadow-sm overflow-hidden">
              <div className="bg-navy px-6 py-4 border-b-4 border-yellow">
                <h3 className="text-sm font-black uppercase tracking-widest text-white">
                  Offer Overview
                </h3>
              </div>

              <div className="p-6 space-y-5">
                {categoryName && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-text">Category</span>
                    <Link
                      href={`/offers/category/${categorySlug}`}
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

                {offer.payout_amount && (
                  <div className="flex items-center justify-between gap-3 bg-navy px-3.5 py-2.5 border-l-4 border-yellow">
                    <span className="text-[10px] font-black uppercase tracking-[0.12em] text-yellow leading-tight">
                      {payLabel}
                    </span>
                    <span className="text-xl font-black text-white leading-none tracking-tight whitespace-nowrap">
                      {offer.payout_amount}
                    </span>
                  </div>
                )}

                <div className="border-t border-border-gray/40 pt-5 space-y-3">
                  {offer.rating && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-gray-text">Safety Score</span>
                      <span className="text-sm font-bold text-navy flex items-center gap-1">
                        <Star size={14} className="fill-yellow text-yellow" /> {offer.rating} / 5
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-text">Verified</span>
                    <span className="text-sm font-bold text-navy">{formatDate(offer.verified_date || offer.created_at)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-text">Views</span>
                    <span className="text-sm font-bold text-navy flex items-center gap-1.5">
                      <Eye size={14} className="text-navy" />
                      {formatNumberAbbreviated(offer.views || 0)}
                    </span>
                  </div>
                </div>

                <OfferClickTracker
                  offerLink={offer.offer_link}
                  slug={slug}
                  className="flex items-center justify-center gap-2 w-full py-3.5 bg-yellow text-navy font-black text-sm uppercase tracking-wider border-2 border-yellow hover:bg-white hover:border-navy transition-all shadow-sm cursor-pointer"
                >
                  Visit Offer <ExternalLink size={16} />
                </OfferClickTracker>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">

            {/* Main Column */}
            <div className="lg:col-span-8 space-y-8 min-w-0">
              <article className="bg-white border border-border-gray/50 shadow-sm overflow-hidden">
                <div className="px-6 sm:px-10 pt-6 sm:pt-10">
                  <AdPlacement placement="offer-content" />
                </div>

                {offer.content && (
                  <div className="px-6 sm:px-10 py-8">
                    <div className="article-body-custom w-full max-w-full">
                      {parse(contentWithAds, {
                        replace: (node: any) => {
                          if (node.type === 'tag' && node.name === 'div' && node.attribs?.class?.includes('ad-placeholder-1')) {
                            return <div className="my-8"><AdSense placement="in_content_middle" /></div>;
                          }
                          if (node.type === 'tag' && node.name === 'div' && node.attribs?.class?.includes('ad-placeholder-2')) {
                            return <div className="my-8"><AdSense placement="in_content_bottom" /></div>;
                          }
                          if (node.type === 'tag' && node.name === 'figure' && node.attribs?.class?.includes('table')) {
                            return (
                              <div
                                className="table-scroll-container my-6"
                                style={{
                                  width: '100%',
                                  maxWidth: '100%',
                                  overflowX: 'auto',
                                  WebkitOverflowScrolling: 'touch',
                                  borderRadius: '8px',
                                  border: '1px solid #E2E8F0',
                                  background: '#ffffff',
                                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                                }}
                              >
                                {domToReact(node.children, {
                                  replace: (childNode: any) => {
                                    if (childNode.type === 'tag' && childNode.name === 'table') {
                                      return (
                                        <table
                                          className="article-table"
                                          style={{
                                            width: '100%',
                                            borderCollapse: 'collapse',
                                            borderSpacing: 0,
                                            margin: 0,
                                            background: '#ffffff',
                                          }}
                                        >
                                          {domToReact(childNode.children, {
                                            replace: (subChild: any) => {
                                              if (subChild.type === 'tag' && (subChild.name === 'td' || subChild.name === 'th' || subChild.name === 'tr')) {
                                                if (subChild.attribs) {
                                                  delete subChild.attribs.width;
                                                  delete subChild.attribs.style;
                                                  delete subChild.attribs.height;
                                                }
                                              }
                                              return subChild;
                                            },
                                          })}
                                        </table>
                                      );
                                    }
                                    return childNode;
                                  },
                                })}
                              </div>
                            );
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
                    createdAt={offer.created_at}
                  />
                  <Reviews offerId={offer.id} initialReviews={initialReviews} />

                  {/* MOBILE ONLY — Related Offers + Ads UNDER Reviews */}
                  <div className="lg:hidden mt-8 space-y-6">
                    {relatedOffers.length > 0 && (
                      <div className="bg-light-gray/60 border border-border-gray p-6">
                        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border-gray/50">
                          <Star size={18} className="text-navy" />
                          <h3 className="font-bold text-navy text-sm uppercase tracking-wider">Related Offers</h3>
                        </div>
                        <div className="space-y-4">
                          {relatedOffers.map((o) => (
                            <OfferCard key={o.id} offer={o} />
                          ))}
                        </div>
                      </div>
                    )}

                    <AdPlacement placement="sidebar" />
                    <AdSense placement="sidebar" />
                  </div>
                </div>

                <div className="px-6 sm:px-10 py-6 border-t border-border-gray/30">
                  <AdPlacement placement="offer-content" />
                </div>
              </article>
            </div>

            {/* DESKTOP ONLY — Offer Overview in sidebar */}
            <aside className="lg:col-span-4 min-w-0 hidden lg:block">
              <div className="sticky top-24 space-y-5">

                <div className="bg-white border border-border-gray shadow-sm overflow-hidden">
                  <div className="bg-navy px-6 py-4 border-b-4 border-yellow">
                    <h3 className="text-sm font-black uppercase tracking-widest text-white">
                      Offer Overview
                    </h3>
                  </div>

                  <div className="p-6 space-y-5">
                    {categoryName && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-gray-text">Category</span>
                        <Link
                          href={`/offers/category/${categorySlug}`}
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

                    {offer.payout_amount && (
                      <div className="flex items-center justify-between gap-3 bg-navy px-3.5 py-2.5 border-l-4 border-yellow">
                        <span className="text-[10px] font-black uppercase tracking-[0.12em] text-yellow leading-tight">
                          {payLabel}
                        </span>
                        <span className="text-xl font-black text-white leading-none tracking-tight whitespace-nowrap">
                          {offer.payout_amount}
                        </span>
                      </div>
                    )}

                    <div className="border-t border-border-gray/40 pt-5 space-y-3">
                      {offer.rating && (
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold uppercase tracking-wider text-gray-text">Safety Score</span>
                          <span className="text-sm font-bold text-navy flex items-center gap-1">
                            <Star size={14} className="fill-yellow text-yellow" /> {offer.rating} / 5
                          </span>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-gray-text">Verified</span>
                        <span className="text-sm font-bold text-navy">{formatDate(offer.verified_date || offer.created_at)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-gray-text">Views</span>
                        <span className="text-sm font-bold text-navy flex items-center gap-1.5">
                          <Eye size={14} className="text-navy" />
                          {formatNumberAbbreviated(offer.views || 0)}
                        </span>
                      </div>
                    </div>

                    <OfferClickTracker
                      offerLink={offer.offer_link}
                      slug={slug}
                      className="flex items-center justify-center gap-2 w-full py-3.5 bg-yellow text-navy font-black text-sm uppercase tracking-wider border-2 border-yellow hover:bg-white hover:border-navy transition-all shadow-sm cursor-pointer"
                    >
                      Visit Offer <ExternalLink size={16} />
                    </OfferClickTracker>
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

          {/* MOBILE ONLY — Redemption UNDER everything */}
          {withdrawMethods.length > 0 && (
            <div className="lg:hidden mt-8">
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
            </div>
          )}

        </div>
      </section>

      {/* RELATED OFFERS — Footer section (bottom of page) */}
      {relatedOffers.length > 0 && (
        <section className="bg-white py-20 border-t border-border-gray/30">
          <div className="max-w-container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between mb-10">
              <div>
                <span className="inline-block text-xs font-black uppercase tracking-[0.2em] text-yellow mb-2">
                  More Like This
                </span>
                <h2 className="text-3xl sm:text-4xl font-black text-navy tracking-tight uppercase">
                  Similar Opportunities
                </h2>
              </div>
              <Link
                href="/offers"
                className="hidden sm:inline-flex items-center gap-1.5 text-sm font-bold text-navy hover:text-yellow transition-colors"
              >
                View All <ChevronRight size={16} />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedOffers.map((o) => (
                <OfferCard key={o.id} offer={o} />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}