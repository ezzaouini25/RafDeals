import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Clock, Calendar, ChevronRight, Award, ShieldCheck, ThumbsUp, ArrowLeft, Eye, Flame } from 'lucide-react';
import {
  getArticleBySlug,
  getAllArticles,
  getAllOffers,
  getOfferBySlug,
  getOfferById,
  getCommentsByArticleSlug,
  getAllDeals,
  getDealById,
  getDealBySlug,
} from '@/lib/queries';
import BlogCard from '@/components/ui/BlogCard';
import OfferCard from '@/components/ui/OfferCard';
import FeaturedDealCard from '@/components/ui/FeaturedDealCard';
import CommentsSection from './CommentsSection';
import GoogleAdSense from '@/components/ui/GoogleAdSense';
import { formatDate } from '@/lib/utils';
import AdPlacement from '@/components/ui/AdPlacement';
import parse from 'html-react-parser';
import AuthorSection from './AuthorSection';
import { formatNumberAbbreviated } from '@/lib/utils';

export const revalidate = 3600;

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const articles = await getAllArticles();
  return articles.map((a) => ({ slug: a.slug }));
}

// ============================================================
// SMART KEYWORD FUNCTIONS
// ============================================================

function getRelatedArticles(current: any, allArticles: any[]) {
  const getWords = (item: any) => {
    const text = `${item.title} ${item.description || ''} ${item.category}`.toLowerCase();
    return new Set(
      text
        .replace(/[^\w\s]/g, '')
        .split(/\s+/)
        .filter(w => w.length > 3 && !['with', 'this', 'from', 'your', 'about', 'guide', 'online', 'earn', 'money', 'free', 'best', 'complete'].includes(w))
    );
  };

  const currentWords = getWords(current);

  return allArticles
    .filter(item => item.id !== current.id)
    .map(item => {
      const itemWords = getWords(item);
      let overlapCount = 0;
      currentWords.forEach(word => {
        if (itemWords.has(word)) overlapCount++;
      });
      if (item.category === current.category) overlapCount += 3;
      return { item, score: overlapCount };
    })
    .sort((a, b) => b.score - a.score)
    .map(entry => entry.item)
    .slice(0, 3);
}

function getRelatedOffers(current: any, allOffers: any[]) {
  const getWords = (item: any) => {
    const text = `${item.title} ${item.description || ''} ${item.type}`.toLowerCase();
    return new Set(
      text
        .replace(/[^\w\s]/g, '')
        .split(/\s+/)
        .filter(w => w.length > 3 && !['with', 'this', 'from', 'your', 'about', 'guide', 'online', 'earn', 'money', 'free', 'best', 'complete'].includes(w))
    );
  };

  const currentWords = getWords(current);

  return allOffers
    .map(item => {
      const itemWords = getWords(item);
      let overlapCount = 0;
      currentWords.forEach(word => {
        if (itemWords.has(word)) overlapCount++;
      });
      return { item, score: overlapCount };
    })
    .sort((a, b) => b.score - a.score)
    .map(entry => entry.item)
    .slice(0, 6);
}

function getRelatedDeals(current: any, allDeals: any[]) {
  const getWords = (item: any) => {
    const text = `${item.title} ${item.description || ''} ${item.category}`.toLowerCase();
    return new Set(
      text
        .replace(/[^\w\s]/g, '')
        .split(/\s+/)
        .filter(w => w.length > 3 && !['with', 'this', 'from', 'your', 'about', 'guide', 'online', 'earn', 'money', 'free', 'best', 'complete'].includes(w))
    );
  };

  const currentWords = getWords(current);

  return allDeals
    .map(item => {
      const itemWords = getWords(item);
      let overlapCount = 0;
      currentWords.forEach(word => {
        if (itemWords.has(word)) overlapCount++;
      });
      return { item, score: overlapCount };
    })
    .sort((a, b) => b.score - a.score)
    .map(entry => entry.item)
    .slice(0, 6);
}

// ============================================================
// INSERT 2 ADS INSIDE CONTENT
// ============================================================

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

  if (totalHeadings >= 3) {
    ad1Position = 1;
    ad2Position = 3;
  } else if (totalHeadings === 2) {
    ad1Position = 1;
    ad2Position = 2;
  } else {
    ad1Position = 1;
    ad2Position = 1;
  }

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

  if (adCount === 1) {
    result += '<div class="my-8 ad-placeholder-2"></div>';
  }

  if (adCount === 0) {
    result += '<div class="my-8 ad-placeholder-1"></div><div class="my-8 ad-placeholder-2"></div>';
  }

  return result;
};

// ============================================================
// RENDER CONTENT WITH OFFERS, DEALS AND ADS
// ============================================================

const renderContentWithOffersAndAds = async (content: string) => {
  if (!content) return null;

  const contentWithAds = insertAdsIntoContent(content);

  const parts = contentWithAds.split(/\[(offer|deal):([^\]]+)\]/);

  if (parts.length === 1) {
    return (
      <div className="article-body-custom">
        {parse(contentWithAds, {
          replace: (node: any) => {
            if (node.type === 'tag' && node.name === 'div' && node.attribs?.class?.includes('ad-placeholder-1')) {
              return (
                <div className="my-8">
                  <GoogleAdSense placement="in_content_middle" />
                </div>
              );
            }
            if (node.type === 'tag' && node.name === 'div' && node.attribs?.class?.includes('ad-placeholder-2')) {
              return (
                <div className="my-8">
                  <GoogleAdSense placement="in_content_bottom" />
                </div>
              );
            }
            return node;
          }
        })}
      </div>
    );
  }

  const elements = [];
  for (let i = 0; i < parts.length; i += 3) {
    const textPart = parts[i];
    const typePart = parts[i + 1];
    const slugPart = parts[i + 2];

    if (textPart) {
      elements.push(
        <div
          key={`text-${i}`}
          className="article-body-custom"
          dangerouslySetInnerHTML={{ __html: textPart }}
        />
      );
    }

    if (!typePart || !slugPart) continue;

    const isNumeric = /^\d+$/.test(slugPart);

    if (typePart === 'offer') {
      const offer = isNumeric
        ? await getOfferById(parseInt(slugPart))
        : await getOfferBySlug(slugPart);

      if (offer) {
        elements.push(
          <div key={`offer-${i}`} className="my-8 max-w-md mx-auto">
            <OfferCard offer={offer} />
          </div>
        );
      } else {
        elements.push(
          <div key={`offer-${i}`} className="my-8 p-4 bg-yellow/10 border border-yellow/30 text-center">
            <p className="text-sm text-gray-text">⚠️ Offer not found: {slugPart}</p>
          </div>
        );
      }
    } else if (typePart === 'deal') {
      const deal = isNumeric
        ? await getDealById(parseInt(slugPart))
        : await getDealBySlug(slugPart);

      if (deal) {
        elements.push(
          <div key={`deal-${i}`} className="my-10 max-w-sm mx-auto">
            <FeaturedDealCard deal={deal} />
          </div>
        );
      } else {
        elements.push(
          <div key={`deal-${i}`} className="my-8 p-4 bg-yellow/10 border border-yellow/30 text-center">
            <p className="text-sm text-gray-text">⚠️ Deal not found: {slugPart}</p>
          </div>
        );
      }
    }
  }

  return elements;
};

// ============================================================
// MAIN PAGE
// ============================================================

export default async function BlogDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) notFound();

  const initialComments = await getCommentsByArticleSlug(slug);

  const allArticles = await getAllArticles();
  const allOffers = await getAllOffers();
  const allDeals = await getAllDeals();

  const relatedArticles = getRelatedArticles(article, allArticles);
  const relatedOffers = getRelatedOffers(article, allOffers);
  const relatedDeals = getRelatedDeals(article, allDeals);

  const contentElements = await renderContentWithOffersAndAds(article.content);

  const hasActiveAuthor = article.author_id && article.author_name;
  const authorName = hasActiveAuthor ? (article.author_name ?? 'EarnMoney Team') : 'EarnMoney Team';
  const authorPicture = hasActiveAuthor ? article.author_picture : null;
  const authorBio = hasActiveAuthor ? article.author_bio : null;
  const authorId = article.author_id;

  const categoryName = article?.category?.name || article?.category_name || null;
  const categorySlug = article?.category?.slug || article?.category_slug || null;
  const categoryDisplay: string | null = categoryName ?? null;

  return (
    <div className="bg-white min-h-screen">

      {/* HERO */}
      <div className="relative w-full min-h-[80vh] sm:min-h-[85vh] bg-navy flex items-end overflow-hidden border-b border-border-gray/30 pt-16 sm:pt-20">
        <div className="absolute inset-0 z-0">
          <Image
            src={article.cover_image || 'https://picsum.photos/seed/placeholder/1200/600'}
            alt={article.title}
            fill
            priority
            referrerPolicy="no-referrer"
            className="object-cover transition-transform duration-1000 scale-100 group-hover:scale-102"
            sizes="100vw"
          />
        </div>

        <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/65 to-navy/15 z-10 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-r from-navy/50 via-transparent to-navy/50 z-10 pointer-events-none" />

        <div className="absolute top-0 left-0 right-0 z-30 pt-4 sm:pt-6 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm text-white/80">
              <Link href="/" className="hover:text-yellow transition-colors">Home</Link>
              <span className="text-white/40">›</span>
              <Link href="/blog" className="hover:text-yellow transition-colors">Blog</Link>
              <span className="text-white/40">›</span>
              <span className="text-white font-semibold line-clamp-1 max-w-[150px] sm:max-w-xs">{article.title}</span>
            </div>
            <Link
              href="/blog"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-white/90 hover:text-yellow transition-colors border border-white/30 px-3 py-1.5 backdrop-blur-sm bg-black/20"
            >
              <ArrowLeft size={14} /> Back to Articles
            </Link>
          </div>
        </div>

        <div className="relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10 sm:pb-16 text-white text-left">
          {categoryDisplay ? (
            categorySlug ? (
              <Link
                href={`/blog/category/${categorySlug}`}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-navy text-yellow text-xs font-extrabold uppercase tracking-widest mb-6 border border-yellow/30 hover:bg-yellow hover:text-navy transition-colors"
              >
                <span className="w-1.5 h-1.5 bg-yellow animate-pulse" />
                {categoryDisplay}
              </Link>
            ) : (
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-navy text-yellow text-xs font-extrabold uppercase tracking-widest mb-6 border border-yellow/30">
                <span className="w-1.5 h-1.5 bg-yellow animate-pulse" />
                {categoryDisplay}
              </span>
            )
          ) : (
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-yellow text-navy text-xs font-extrabold uppercase tracking-widest mb-6 border border-yellow shadow-md">
              <span className="w-1.5 h-1.5 bg-navy animate-pulse" />
              Article
            </span>
          )}

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight mb-6 drop-shadow-md max-w-4xl">
            {article.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm font-semibold border-t border-white/20 pt-6">
            {article.read_time && (
              <span className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3.5 py-1.5 border border-white/10 text-white shadow-sm">
                <Clock size={15} className="text-yellow" />
                <span>{article.read_time} Min Read</span>
              </span>
            )}
            <span className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3.5 py-1.5 border border-white/10 text-white shadow-sm">
              <Calendar size={15} className="text-yellow" />
              <span>{formatDate(article.created_at)}</span>
            </span>
            <span className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3.5 py-1.5 border border-white/10 text-white shadow-sm">
              <ShieldCheck size={15} className="text-emerald-400" />
              <span className="text-emerald-300">Verified Guide</span>
            </span>
            <span className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3.5 py-1.5 border border-white/10 text-white shadow-sm">
              <Eye size={15} className="text-yellow" />
              <span>{formatNumberAbbreviated(article.views || 0)} views</span>
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <GoogleAdSense placement="article_top" />
      </div>

      {/* Content grid */}
      <div className="bg-light-gray/40 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

            {/* Main content — forced first on mobile */}
            <div className="lg:col-span-8 min-w-0 order-1 lg:order-none">
              <div className="bg-white border border-border-gray/50 p-6 sm:p-10 md:p-12 overflow-x-auto">
                <div className="mb-6">
                  <AdPlacement placement="article-content" />
                </div>

                <div className="mt-0">
                  {contentElements}
                </div>

                <div className="mt-8">
                  <GoogleAdSense placement="article_bottom" />
                </div>

                <AuthorSection
                  authorId={authorId}
                  authorName={authorName}
                  authorPicture={authorPicture}
                  authorBio={authorBio}
                  createdAt={article.created_at}
                />

                <CommentsSection articleSlug={slug} initialComments={initialComments} />
              </div>
            </div>

            {/* Sidebar — forced after content on mobile, right side on desktop */}
            <div className="lg:col-span-4 min-w-0 self-start order-2 lg:order-none">
              <div className="sticky top-24 space-y-6">

                {/* Article Details */}
                <div className="bg-white border border-border-gray p-6 shadow-card">
                  <h3 className="font-bold text-navy text-sm uppercase tracking-wider mb-4 pb-3 border-b border-border-gray/50">
                    Article Details
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-text">Category</span>
                      <span className="font-semibold text-navy">{categoryDisplay || 'General'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-text">Author</span>
                      <span className="font-semibold text-navy">{authorName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-text">Published</span>
                      <span className="font-semibold text-navy">{formatDate(article.created_at)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-text">Read Time</span>
                      <span className="font-semibold text-navy">{article.read_time || 5} min</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-text">Views</span>
                      <span className="font-semibold text-navy">{article.views || 0}</span>
                    </div>
                  </div>
                </div>

                {/* Related Offers */}
                {relatedOffers.length > 0 && (
                  <div className="bg-white border border-border-gray p-6 shadow-card">
                    <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border-gray/50">
                      <ThumbsUp size={18} className="text-navy" />
                      <h3 className="font-bold text-navy text-sm uppercase tracking-wider">Related Offers</h3>
                    </div>
                    <div className="space-y-4">
                      {relatedOffers[0] && <OfferCard key={relatedOffers[0].id} offer={relatedOffers[0]} variant="compact" />}
                      {relatedOffers[1] && <OfferCard key={relatedOffers[1].id} offer={relatedOffers[1]} variant="compact" />}
                      {relatedOffers[2] && <OfferCard key={relatedOffers[2].id} offer={relatedOffers[2]} variant="compact" />}
                    </div>
                  </div>
                )}

                <AdPlacement placement="sidebar" />

                {/* Related Deals */}
                {relatedDeals.length > 0 && (
                  <div className="bg-white border border-border-gray p-6 shadow-card">
                    <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border-gray/50">
                      <Flame size={18} className="text-navy" />
                      <h3 className="font-bold text-navy text-sm uppercase tracking-wider">Related Deals</h3>
                    </div>
                    <div className="space-y-4">
                      {relatedDeals[0] && (
                        <div>
                          <FeaturedDealCard deal={relatedDeals[0]} />
                        </div>
                      )}
                      {relatedDeals[1] && (
                        <div>
                          <FeaturedDealCard deal={relatedDeals[1]} />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <GoogleAdSense placement="sidebar" />

              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <GoogleAdSense placement="article_bottom" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
        <AdPlacement placement="article-content" />
      </div>

      {/* Related Articles */}
      {relatedArticles.length > 0 && (
        <div className="bg-light-gray/25 py-12 border-t border-border-gray/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2.5 mb-6">
              <Award className="text-navy" size={20} />
              <h2 className="text-xl font-black text-navy tracking-tight">Related Strategy Guides</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-6">
              {relatedArticles.map((a) => (
                <BlogCard key={a.id} article={a} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}