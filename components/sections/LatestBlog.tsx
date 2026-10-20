'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, ChevronLeft, ChevronRight, Calendar, User } from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface Article {
  id: number;
  title: string;
  slug: string;
  cover_image: string | null;
  category_name?: string | null;
  author_name: string | null;
  created_at: string;
}

interface LatestBlogProps {
  articles: Article[];
}

const AUTO_SLIDE_MS = 6000;

export default function LatestBlog({ articles }: LatestBlogProps) {
  // Split into slides of 3: [big, small, small]
  const slides = [];
  for (let i = 0; i < articles.length; i += 3) {
    slides.push(articles.slice(i, i + 3));
  }

  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const totalSlides = slides.length;

  // Auto-advance
  useEffect(() => {
    if (totalSlides <= 1 || paused) return;
    timerRef.current = setInterval(() => {
      setCurrent((c) => (c + 1) % totalSlides);
    }, AUTO_SLIDE_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [totalSlides, paused]);

  const goNext = () => setCurrent((c) => (c + 1) % totalSlides);
  const goPrev = () => setCurrent((c) => (c - 1 + totalSlides) % totalSlides);

  if (!articles || articles.length === 0) return null;

  return (
    <section className="bg-light-gray py-20 md:py-28 overflow-hidden">
      <div className="max-w-container mx-auto px-4 sm:px-6 lg:px-8">

        {/* HEADER - Centered Titles */}
        <div className="flex flex-col items-center text-center max-w-2xl mx-auto mb-16">
          <span className="inline-block text-[11px] font-black uppercase tracking-widest text-yellow-hover mb-3 border-2 border-yellow px-3 py-1">
            Latest Insights
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-navy tracking-tight uppercase leading-[1.1]">
            Latest Insights & Guides
          </h2>
          <p className="mt-4 text-gray-text text-sm sm:text-base leading-relaxed max-w-xl">
            Read simple guides and smart tips to learn how to save money, find the best daily deals, and make great choices for every purchase.
          </p>
        </div>

        {/* SLIDER */}
        <div
          className="relative"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          {/* Slides track */}
          <div className="overflow-hidden">
            <div
              className="flex transition-transform duration-700 ease-in-out"
              style={{ transform: `translateX(-${current * 100}%)` }}
            >
              {slides.map((slide, slideIdx) => (
                <div
                  key={slideIdx}
                  className="w-full shrink-0 flex flex-col md:grid md:grid-cols-3 gap-4 md:gap-6"
                >
                  {/* BIG CARD — left side, spans 2 cols on desktop/tablet */}
                  {slide[0] && (
                    <div className="md:col-span-2">
                      <BigArticleCard article={slide[0]} />
                    </div>
                  )}

                  {/* 2 SMALL CARDS — right column, stacked */}
                  <div className="flex flex-col gap-4 md:gap-6 md:col-span-1">
                    {slide[1] && (
                      <div className="flex-1">
                        <SmallArticleCard article={slide[1]} />
                      </div>
                    )}
                    {slide[2] && (
                      <div className="flex-1">
                        <SmallArticleCard article={slide[2]} />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* DESKTOP ARROWS - Sharp Edges */}
          {totalSlides > 1 && (
            <>
              <button
                onClick={goPrev}
                aria-label="Previous slide"
                className="hidden md:flex absolute top-1/2 -left-5 -translate-y-1/2 w-12 h-12 items-center justify-center bg-white border-2 border-gray-200 shadow-lg text-navy hover:bg-yellow hover:border-yellow transition-all z-10 rounded-none"
              >
                <ChevronLeft size={24} />
              </button>
              <button
                onClick={goNext}
                aria-label="Next slide"
                className="hidden md:flex absolute top-1/2 -right-5 -translate-y-1/2 w-12 h-12 items-center justify-center bg-white border-2 border-gray-200 shadow-lg text-navy hover:bg-yellow hover:border-yellow transition-all z-10 rounded-none"
              >
                <ChevronRight size={24} />
              </button>
            </>
          )}
        </div>

        {/* DOTS + MOBILE ARROWS - Sharp Edges */}
        {totalSlides > 1 && (
          <div className="mt-10 flex items-center justify-center gap-4">
            <button
              onClick={goPrev}
              aria-label="Previous slide"
              className="md:hidden flex w-10 h-10 items-center justify-center border-2 border-gray-200 text-navy hover:bg-yellow hover:border-yellow transition-colors rounded-none"
            >
              <ChevronLeft size={20} />
            </button>

            <div className="flex items-center gap-2">
              {slides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  aria-label={`Go to slide ${i + 1}`}
                  className={`transition-all duration-300 rounded-none ${
                    i === current
                      ? 'w-8 h-2.5 bg-navy'
                      : 'w-2.5 h-2.5 bg-gray-300 hover:bg-gray-400'
                  }`}
                />
              ))}
            </div>

            <button
              onClick={goNext}
              aria-label="Next slide"
              className="md:hidden flex w-10 h-10 items-center justify-center border-2 border-gray-200 text-navy hover:bg-yellow hover:border-yellow transition-colors rounded-none"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        )}

        {/* VIEW ALL BUTTON (Bottom) */}
        <div className="mt-12 text-center">
          <Link
            href="/blog"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-yellow text-navy font-black text-sm uppercase tracking-widest hover:bg-navy hover:text-white transition-colors border-2 border-yellow hover:border-navy rounded-none"
          >
            View All Articles
            <ArrowRight size={18} />
          </Link>
        </div>

      </div>
    </section>
  );
}

// ============================================================
// BIG CARD — left side of slider
// ============================================================
function BigArticleCard({ article }: { article: Article }) {
  return (
    <Link
      href={`/blog/${article.slug}`}
      className="group relative flex flex-col justify-end block overflow-hidden aspect-[4/3] sm:aspect-[16/9] md:aspect-auto md:h-full md:min-h-[400px] lg:min-h-[480px] bg-navy rounded-none"
    >
      {/* Background image */}
      <Image
        src={article.cover_image || 'https://picsum.photos/seed/placeholder/1200/800'}
        alt={article.title}
        fill
        priority
        referrerPolicy="no-referrer"
        className="object-cover transition-transform duration-700 group-hover:scale-105"
        sizes="(max-width: 768px) 100vw, 66vw"
      />

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-navy/95 via-navy/60 to-transparent" />

      {/* Category badge - Sharp */}
      {article.category_name && (
        <span className="absolute top-5 left-5 px-3 py-1.5 bg-yellow text-navy text-[10px] font-black uppercase tracking-widest z-10 rounded-none">
          {article.category_name}
        </span>
      )}

      {/* Content */}
      <div className="relative z-10 p-5 sm:p-7 md:p-8 lg:p-10 w-full">
        <h3 className="text-xl sm:text-3xl lg:text-4xl font-black text-white leading-tight line-clamp-3 group-hover:text-yellow transition-colors mb-3 md:mb-4 uppercase">
          {article.title}
        </h3>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs sm:text-sm text-white/80">
          {article.author_name && (
            <span className="flex items-center gap-1.5 font-semibold text-white">
              <User size={14} className="text-yellow" />
              {article.author_name}
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <Calendar size={14} className="text-yellow" />
            {formatDate(article.created_at)}
          </span>
        </div>
      </div>
    </Link>
  );
}

// ============================================================
// SMALL CARD — right column, stacked
// ============================================================
function SmallArticleCard({ article }: { article: Article }) {
  return (
    <Link
      href={`/blog/${article.slug}`}
      className="group relative flex flex-col justify-end block overflow-hidden aspect-[4/3] sm:aspect-[16/9] md:aspect-auto md:h-full md:min-h-[190px] lg:min-h-[228px] bg-navy rounded-none"
    >
      {/* Background image */}
      <Image
        src={article.cover_image || 'https://picsum.photos/seed/placeholder/800/500'}
        alt={article.title}
        fill
        referrerPolicy="no-referrer"
        className="object-cover transition-transform duration-700 group-hover:scale-105"
        sizes="(max-width: 768px) 100vw, 33vw"
      />

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-navy/95 via-navy/50 to-transparent" />

      {/* Category badge - Sharp */}
      {article.category_name && (
        <span className="absolute top-4 left-4 px-2.5 py-1 bg-yellow text-navy text-[9px] font-black uppercase tracking-widest z-10 rounded-none">
          {article.category_name}
        </span>
      )}

      {/* Content */}
      <div className="relative z-10 p-4 sm:p-5 md:p-6 w-full">
        <h3 className="text-base sm:text-lg md:text-xl font-bold text-white leading-snug line-clamp-2 group-hover:text-yellow transition-colors mb-2 uppercase">
          {article.title}
        </h3>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[10px] sm:text-[11px] text-white/70">
          {article.author_name && (
            <span className="flex items-center gap-1 font-semibold text-white/90">
              <User size={12} className="text-yellow" />
              {article.author_name}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Calendar size={12} className="text-yellow" />
            {formatDate(article.created_at)}
          </span>
        </div>
      </div>
    </Link>
  );
}