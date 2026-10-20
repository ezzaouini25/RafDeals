'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import {
  Search,
  Loader2,
  Star,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Plus,
  ExternalLink,
  Gift,
} from 'lucide-react';
import Modal from './Modal';

// ============================================================
// TYPES
// ============================================================
export interface PickerOffer {
  id: number;
  title: string;
  slug: string;
  cover_image: string | null;
  rating: number | string | null;
  verified_date: string | null;
  category_name: string | null;
}

interface OfferPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (offer: PickerOffer) => void;
}

const LIMIT = 10;

// ============================================================
// HELPERS
// ============================================================
function formatVerified(date: string | null): string {
  if (!date) return '';
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  } catch {
    return '';
  }
}

function formatRating(rating: number | string | null): string | null {
  if (rating === null || rating === undefined || rating === '') return null;
  const num = Number(rating);
  if (isNaN(num)) return null;
  return num.toFixed(1);
}

// ============================================================
// COMPONENT
// ============================================================
export default function OfferPickerModal({
  isOpen,
  onClose,
  onInsert,
}: OfferPickerModalProps) {
  const [offers, setOffers] = useState<PickerOffer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Debounce search input (350ms)
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [search]);

  // Reset state every time modal opens
  useEffect(() => {
    if (isOpen) {
      setSearch('');
      setDebouncedSearch('');
      setPage(1);
    }
  }, [isOpen]);

  // Fetch offers from existing admin API
  const fetchOffers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', String(LIMIT));
      if (debouncedSearch) params.set('search', debouncedSearch);

      const res = await fetch(`/api/admin/offers?${params.toString()}`, {
        cache: 'no-store',
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to fetch offers');
      }

      const data = await res.json();
      setOffers(data.offers || []);
      setTotalPages(data.totalPages || 1);
      setTotalItems(data.total || 0);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch offers');
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch]);

  useEffect(() => {
    if (isOpen) fetchOffers();
  }, [isOpen, fetchOffers]);

  // Pagination window
  const getPageNumbers = () => {
    const pages: number[] = [];
    const maxVisible = 5;
    let start = 1;
    let end = totalPages;
    if (totalPages > maxVisible) {
      const half = Math.floor(maxVisible / 2);
      if (page <= half + 1) {
        start = 1;
        end = maxVisible;
      } else if (page >= totalPages - half) {
        start = totalPages - maxVisible + 1;
        end = totalPages;
      } else {
        start = page - half;
        end = page + half;
      }
    }
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Insert Offer into Article"
      maxWidth="max-w-3xl"
    >
      <div className="space-y-4">
        {/* Search bar */}
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search offers by title..."
            autoFocus
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm rounded-lg focus:border-yellow focus:ring-1 focus:ring-yellow transition-colors"
          />
          {loading && (
            <Loader2
              size={16}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-yellow animate-spin"
            />
          )}
        </div>

        {/* Counter */}
        <div className="text-xs text-slate-500 dark:text-slate-400">
          {totalItems > 0
            ? `${totalItems} offer${totalItems !== 1 ? 's' : ''} found`
            : 'No offers yet'}
        </div>

        {/* List */}
        <div className="min-h-[260px]">
          {loading && offers.length === 0 ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={28} className="animate-spin text-yellow" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-sm text-rose-500 font-medium">{error}</p>
              <button
                onClick={fetchOffers}
                className="mt-3 px-4 py-2 text-xs font-bold text-yellow border border-yellow/40 hover:bg-yellow/10 rounded transition-colors"
              >
                Retry
              </button>
            </div>
          ) : offers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400 dark:text-slate-500">
              <Gift size={40} className="mb-3 opacity-30" />
              <p className="text-sm font-medium">
                {debouncedSearch
                  ? 'No offers match your search'
                  : 'No offers available'}
              </p>
              <p className="text-xs mt-1 opacity-70">
                {debouncedSearch
                  ? 'Try a different keyword'
                  : 'Create offers first from the Offers page'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {offers.map((offer) => {
                const verified = formatVerified(offer.verified_date);
                const ratingDisplay = formatRating(offer.rating);

                return (
                  <div
                    key={offer.id}
                    className="group flex items-stretch gap-3 p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg hover:border-yellow/60 hover:shadow-sm transition-all"
                  >
                    {/* Clickable preview area (opens offer detail page in new tab) */}
                    <a
                      href={`/offers/${offer.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex flex-1 items-center gap-3 min-w-0 cursor-pointer"
                      title="Open offer detail (new tab)"
                    >
                      {/* Thumbnail */}
                      <div className="relative w-16 h-16 shrink-0 rounded-md overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                        {offer.cover_image ? (
                          <Image
                            src={offer.cover_image}
                            alt={offer.title}
                            fill
                            sizes="64px"
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400">
                            <Gift size={20} />
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-semibold text-sm text-slate-900 dark:text-white line-clamp-2 leading-snug group-hover:text-yellow transition-colors">
                            {offer.title}
                          </h4>
                          <ExternalLink
                            size={12}
                            className="shrink-0 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity"
                          />
                        </div>

                        <div className="flex items-center flex-wrap gap-x-3 gap-y-1 mt-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                          {ratingDisplay && (
                            <span className="inline-flex items-center gap-1">
                              <Star
                                size={11}
                                className="fill-yellow text-yellow"
                              />
                              <span className="font-semibold text-slate-700 dark:text-slate-300">
                                {ratingDisplay}
                              </span>
                            </span>
                          )}

                          {verified && (
                            <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                              <ShieldCheck size={11} />
                              Verified {verified}
                            </span>
                          )}

                          {offer.category_name && (
                            <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded">
                              {offer.category_name}
                            </span>
                          )}
                        </div>
                      </div>
                    </a>

                    {/* Insert button */}
                    <button
                      type="button"
                      onClick={() => onInsert(offer)}
                      className="shrink-0 self-center inline-flex items-center gap-1 px-3 py-2 bg-yellow text-slate-950 text-xs font-bold rounded hover:bg-yellow/90 transition-colors"
                      title="Insert this offer into the article"
                    >
                      <Plus size={13} />
                      Insert
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Page {page} of {totalPages}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1 || loading}
                className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed rounded transition-colors"
              >
                <ChevronLeft size={16} />
              </button>

              {getPageNumbers().map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setPage(n)}
                  disabled={loading}
                  className={`min-w-[28px] h-7 px-2 text-xs font-medium rounded transition-colors ${
                    n === page
                      ? 'bg-yellow text-slate-950'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {n}
                </button>
              ))}

              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages || loading}
                className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed rounded transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}