'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, TrendingUp, Sparkles, AlertTriangle, Tag, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SearchPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

// ============================================================
// POPULAR SEARCHES - DYNAMIC FROM OFFERS & ARTICLES
// ============================================================

export default function SearchPopup({ isOpen, onClose }: SearchPopupProps) {
  const [query, setQuery] = useState('');
  const [popularSearches, setPopularSearches] = useState<{ term: string; label: string; type: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch popular searches from API
  useEffect(() => {
    const fetchPopularSearches = async () => {
      try {
        const res = await fetch('/api/public/popular-searches', {
          cache: 'no-store',
        });
        if (res.ok) {
          const data = await res.json();
          setPopularSearches(data.searches || []);
        } else {
          // Fallback to static if API fails
          setPopularSearches([
            { term: 'Freecash', label: 'Freecash Review', type: 'offer' },
            { term: 'scams', label: 'Avoid Online Scams', type: 'article' },
            { term: 'surveys', label: 'Paid Surveys', type: 'offer' },
            { term: 'passive', label: 'Passive Income', type: 'article' },
            { term: 'testing', label: 'Website Testing', type: 'offer' },
            { term: 'side hustles', label: 'Side Hustles Guide', type: 'article' },
          ]);
        }
      } catch (error) {
        console.error('Error fetching popular searches:', error);
        // Fallback
        setPopularSearches([
          { term: 'Freecash', label: 'Freecash Review', type: 'offer' },
          { term: 'scams', label: 'Avoid Online Scams', type: 'article' },
          { term: 'surveys', label: 'Paid Surveys', type: 'offer' },
          { term: 'passive', label: 'Passive Income', type: 'article' },
          { term: 'testing', label: 'Website Testing', type: 'offer' },
        ]);
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      fetchPopularSearches();
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      return () => {
        document.body.style.overflow = '';
        clearTimeout(timer);
      };
    }
  }, [isOpen]);

  const handleSearch = (searchTerm: string) => {
    if (!searchTerm.trim()) return;
    onClose();
    router.push(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(query);
  };

  const getTypeIcon = (type: string) => {
    if (type === 'offer') return <Tag size={12} className="text-yellow shrink-0" />;
    if (type === 'article') return <BookOpen size={12} className="text-blue-500 shrink-0" />;
    return <Sparkles size={12} className="text-yellow shrink-0" />;
  };

  const getTypeLabel = (type: string) => {
    if (type === 'offer') return 'Offer';
    if (type === 'article') return 'Guide';
    return 'Trending';
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-navy/65 backdrop-blur-sm"
          />

          {/* Dialog Panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ type: 'spring', duration: 0.35 }}
            className="relative w-full max-w-2xl bg-transparent overflow-visible z-10"
            id="search-popup-panel"
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="absolute -top-3.5 -right-3.5 z-30 flex items-center justify-center w-10 h-10 bg-navy text-white hover:bg-yellow hover:text-navy hover:rotate-90 hover:scale-110 active:scale-95 transition-all duration-300 shadow-xl border border-white/20 cursor-pointer group"
              aria-label="Close search popup"
            >
              <X size={18} className="stroke-[2.5] group-hover:scale-110 transition-transform" />
            </button>

            {/* Content */}
            <div className="w-full bg-white border border-border-gray/80 overflow-hidden">
              <form onSubmit={onSubmit} className="flex items-center gap-2.5 sm:gap-4 px-4 sm:px-6 py-4 border-b border-border-gray/60">
                <Search className="text-navy/50 shrink-0" size={18} />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search side-hustles, guides, offers..."
                  className="flex-1 text-sm sm:text-base text-navy placeholder:text-gray-text/40 focus:outline-none bg-transparent py-1 font-semibold"
                  aria-label="Search input"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery('')}
                    className="p-1.5 text-gray-text hover:text-navy transition-colors hover:bg-light-gray mr-1"
                    aria-label="Clear query"
                  >
                    <X size={14} />
                  </button>
                )}
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-4 sm:px-5 py-2 sm:py-2.5 bg-yellow hover:bg-yellow-hover text-navy text-xs font-black tracking-wider uppercase transition-all duration-200 active:scale-95 shadow-[0_4px_12px_rgba(234,179,8,0.2)] hover:shadow-[0_4px_18px_rgba(234,179,8,0.35)] shrink-0 cursor-pointer border border-yellow"
                >
                  <Search size={13} className="stroke-[3px]" />
                  <span className="hidden xs:inline">Search</span>
                </button>
              </form>

              <div className="p-6 bg-white">
                <div className="flex items-center gap-2 text-xs font-extrabold text-navy/40 uppercase tracking-widest mb-3">
                  <TrendingUp size={14} />
                  Popular Searches
                </div>
                
                {/* Dynamic Popular Searches */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {loading ? (
                    <div className="flex items-center gap-2 text-xs text-gray-text">
                      <div className="w-4 h-4 border-2 border-navy/20 border-t-yellow animate-spin rounded-full" />
                      Loading...
                    </div>
                  ) : (
                    popularSearches.map((item, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSearch(item.term)}
                        className="flex items-center gap-1.5 px-3.5 py-2 bg-light-gray hover:bg-yellow/15 border border-border-gray/60 hover:border-yellow/50 text-navy hover:text-navy text-xs font-semibold transition-all cursor-pointer shadow-sm hover:shadow"
                      >
                        {getTypeIcon(item.type)}
                        {item.label}
                        <span className="text-[9px] text-gray-text/50 font-normal uppercase tracking-wider ml-0.5">
                          {getTypeLabel(item.type)}
                        </span>
                      </button>
                    ))
                  )}
                </div>

                <div className="border-t border-border-gray/40 pt-4 flex items-start gap-3">
                  <div className="w-8 h-8 bg-emerald-50 text-emerald-600 shrink-0 flex items-center justify-center border border-emerald-200">
                    <AlertTriangle size={16} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-navy mb-0.5">Tested &amp; Verified Safely</h4>
                    <p className="text-[11px] text-gray-text leading-relaxed">
                      Every offer on EarnMoney is tested by real staff members to verify payouts and safety before we publish.
                    </p>
                  </div>
                </div>
              </div>

              <div className="hidden md:flex justify-between items-center px-6 py-3 bg-light-gray/60 border-t border-border-gray/30 text-[10px] text-gray-text font-medium">
                <span>Press <span className="font-bold text-navy">Enter</span> to search</span>
                <span>Click outside to close</span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}