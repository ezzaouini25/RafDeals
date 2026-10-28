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
import parse from 'html-react-parser';
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

const OFFER_PAGE_FAQS = [
  { id: 1, question: 'What is RafDeals and how does it work?', answer: 'RafDeals is a curated deals site that brings together the best offers and promotions from Impact and ClickBank. We list things like bank bonuses, cashback apps, pet food discounts, beauty deals, home essentials, and travel promos. Instead of hunting across dozens of websites, you can browse everything in one place and click straight through to the brand\'s site to claim the offer.' },
  { id: 2, question: 'What kind of deals do you feature?', answer: 'A bit of everything, honestly. We list bank bonuses, cashback apps, pet food discounts, beauty deals, home essentials, car offers, travel promos, and plenty of other categories. Most of our offers come from Impact and ClickBank, so you are getting them straight from the brands themselves. If it helps you save money or earn a reward, we probably have something for it.' },
  { id: 3, question: 'How do I find the best offers on the site?', answer: 'Start by browsing the categories that interest you most, like finance, pets, beauty, or travel. We also highlight a hand-picked selection of the best deals on the homepage each day, so you can see the top offers at a glance. If you are looking for a specific type of deal, use the search bar or filter by region to narrow things down quickly.' },
  { id: 4, question: 'Do I have to pay to use the site?', answer: 'No, using RafDeals is completely free. We earn a small commission from the merchant when someone claims an offer through our links, and that is what keeps the lights on. You never pay us a fee, a subscription, or a hidden cost to browse and claim deals.' },
  { id: 5, question: 'How do I actually claim a deal?', answer: 'Click the offer you like, read the short instructions we put on the page, then complete the steps on the merchant\'s website. That could mean signing up, downloading an app, or making a qualifying purchase. Whatever the brand asks for, we spell it out clearly before you click so there are no surprises.' },
  { id: 6, question: 'How often do you add new offers?', answer: 'Every day, pretty much. We update RafDeals daily because some promotions expire fast, so we are constantly swapping them out and adding fresh ones to the site. If you check back once a week, you will almost always find something new to claim, whether it is a bank bonus or a pet discount.' },
  { id: 7, question: 'Are these deals available in my country?', answer: 'Most offers are available in the US, UK, or Australia, and a few are global. We put a small label on each offer telling you which region it is for, so you know before you click. If you see an offer that is not available in your country, just skip it and check the rest of the feed.' },
  { id: 8, question: 'What happens to my personal info when I sign up?', answer: 'RafDeals does not touch your data at all. When you click an offer, you are redirected to the merchant\'s secure website, and they handle your information from that point on. We only partner with brands that have a solid reputation and clear privacy policies, so your details stay in safe hands throughout the signup process.' },
  { id: 9, question: 'Some offers ask for a deposit. Is that normal?', answer: 'Sometimes, yes, especially with banks and finance offers that require a small deposit to open an account. We always mention it in the offer description so you are not caught off guard. If an offer is free to claim with no deposit needed, we say that too, so you know exactly what you are getting into.' },
  { id: 10, question: 'Can I trust the brands you list?', answer: 'We only work with merchants we can verify. Before an offer goes live, we check the brand\'s track record, read user reviews, and confirm that their payout or discount process actually works. If a merchant has a history of complaints or shady behavior, they do not make it onto the site.' },
  { id: 11, question: 'How do I search for a specific deal, like pet food or bank bonuses?', answer: 'Use the search bar at the top of the site or click into the category that matches what you need, like Pets, Finance, or Beauty. Each category page shows every active offer in that section, sorted by popularity or newest first. If you still cannot find what you are looking for, check back later since we add new deals daily and rotate them out often.' },
];

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

        {/* Breadcrumb */}
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

        {/* Hero body */}
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
        <div className="max-w-container mx-auto px-4 sm:px-6 lg:px-8 overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">

            {/* Main Column — forced FIRST on mobile */}
            <div className="lg:col-span-8 space-y-8 min-w-0 order-1 lg:order-none">
              <article className="bg-white border border-border-gray/50 shadow-sm overflow-x-auto">
                <div className="px-6 sm:px-10 pt-6 sm:pt-10">
                  <AdPlacement placement="offer-content" />
                </div>

                {offer.content && (
                  <div className="px-6 sm:px-10 py-8">
                    <div className="article-body-custom">
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
                    createdAt={offer.created_at}
                  />
                  <Reviews offerId={offer.id} initialReviews={initialReviews} />
                </div>

                <div className="px-6 sm:px-10 py-6 border-t border-border-gray/30">
                  <AdPlacement placement="offer-content" />
                </div>
              </article>
            </div>

            {/* Sidebar — forced SECOND on mobile, right on desktop */}
            <aside className="lg:col-span-4 min-w-0 self-start order-2 lg:order-none">
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
        </div>
      </section>

      {/* RELATED OFFERS */}
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