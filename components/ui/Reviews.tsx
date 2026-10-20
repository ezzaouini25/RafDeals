'use client';

import { useState, useTransition, useEffect } from 'react';
import {
  Star,
  User,
  Mail,
  MessageSquare,
  Send,
  CheckCircle,
  AlertCircle,
  Clock,
  Loader2,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';
import { Comment } from '@/types';
import { formatDate } from '@/lib/utils';
import { submitReview, checkUserBlocked } from '@/app/actions/review';
import { generateDeviceFingerprint } from '@/lib/fingerprint';

interface ReviewsProps {
  offerId?: number;
  dealId?: number;
  initialReviews: Comment[];
}

// ============================================================
// REVIEWS POPUP
// ============================================================
function ReviewsPopup({
  reviews,
  isOpen,
  onClose,
}: {
  reviews: Comment[];
  isOpen: boolean;
  onClose: () => void;
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const reviewsPerPage = 5;
  const totalPages = Math.ceil(reviews.length / reviewsPerPage);

  const indexOfLastReview = currentPage * reviewsPerPage;
  const indexOfFirstReview = indexOfLastReview - reviewsPerPage;
  const currentReviews = reviews.slice(indexOfFirstReview, indexOfLastReview);

  if (!isOpen) return null;

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative bg-white border border-border-gray max-w-2xl w-full max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-border-gray/50">
          <h3 className="text-lg font-bold text-navy">
            All Reviews ({reviews.length})
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-navy transition-colors border border-border-gray p-1"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
          {currentReviews.length === 0 ? (
            <p className="text-gray-text text-sm text-center py-8">No reviews available.</p>
          ) : (
            <div className="space-y-4">
              {currentReviews.map((review) => (
                <div key={review.id} className="border border-border-gray/50 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-navy text-yellow font-bold flex items-center justify-center text-xs border border-yellow">
                        {review.author_name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-bold text-navy text-sm">{review.author_name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={14}
                          className={
                            i < (review.rating || 0)
                              ? 'fill-yellow text-yellow'
                              : 'fill-gray-200 text-gray-200'
                          }
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-gray-text">{review.content}</p>
                  <p className="text-xs text-gray-text mt-2">{formatDate(review.created_at)}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-border-gray/50">
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className={`flex items-center gap-1 px-3 py-1.5 border border-border-gray text-sm font-medium transition-colors ${
                currentPage === 1
                  ? 'opacity-40 cursor-not-allowed text-gray-text'
                  : 'hover:bg-light-gray/20 text-navy'
              }`}
            >
              <ChevronLeft size={16} />
              Previous
            </button>

            <span className="text-sm text-gray-text">
              Page {currentPage} of {totalPages}
            </span>

            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`flex items-center gap-1 px-3 py-1.5 border border-border-gray text-sm font-medium transition-colors ${
                currentPage === totalPages
                  ? 'opacity-40 cursor-not-allowed text-gray-text'
                  : 'hover:bg-light-gray/20 text-navy'
              }`}
            >
              Next
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function Reviews({ offerId, dealId, initialReviews }: ReviewsProps) {
  const [reviews, setReviews] = useState<Comment[]>(initialReviews || []);
  const [isPending, startTransition] = useTransition();
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error' | 'blocked'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [fingerprint, setFingerprint] = useState('');
  const [isBlocked, setIsBlocked] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  const displayedReviews = reviews.slice(0, 3);
  const hasMoreReviews = reviews.length > 3;

  const isDeal = !!dealId;
  const itemLabel = isDeal ? 'deal' : 'offer';

  const [formData, setFormData] = useState({
    author_name: '',
    author_email: '',
    content: '',
    rating: 5,
  });

  // Generate fingerprint
  useEffect(() => {
    try {
      const fp = generateDeviceFingerprint();
      setFingerprint(fp);
    } catch (error) {
      console.error('Failed to generate fingerprint:', error);
    }
  }, []);

  // Check block status
  useEffect(() => {
    if (!fingerprint) return;

    const checkStatus = async () => {
      try {
        const result = await checkUserBlocked(fingerprint);
        if (result.blocked) {
          setIsBlocked(true);
          setRemainingSeconds(result.remaining_seconds || 86400);
          setSubmitStatus('blocked');
        }
      } catch (error) {
        console.error('Failed to check block status:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkStatus();
  }, [fingerprint]);

  // Countdown
  useEffect(() => {
    if (!isBlocked || remainingSeconds <= 0) return;

    const timer = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          setIsBlocked(false);
          setSubmitStatus('idle');
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isBlocked, remainingSeconds]);

  const formatCountdown = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const averageRating =
    reviews.length > 0
      ? reviews.reduce((acc, r) => acc + (r.rating || 0), 0) / reviews.length
      : 0;

  const ratingCounts = reviews.reduce((acc, r) => {
    const rating = Math.floor(r.rating || 0);
    acc[rating] = (acc[rating] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitStatus('idle');
    setErrorMessage('');

    if (isBlocked) {
      setSubmitStatus('blocked');
      return;
    }

    // Validate IDs
    if (!dealId && !offerId) {
      setSubmitStatus('error');
      setErrorMessage('Missing offer/deal ID');
      return;
    }

    const formDataObj = new FormData();

    // ✅ Send EITHER dealId or offerId
    if (dealId) {
      formDataObj.append('dealId', String(dealId));
    } else if (offerId) {
      formDataObj.append('offerId', String(offerId));
    }

    formDataObj.append('author_name', formData.author_name);
    formDataObj.append('author_email', formData.author_email);
    formDataObj.append('content', formData.content);
    formDataObj.append('rating', String(formData.rating));
    formDataObj.append('device_fingerprint', fingerprint);

    // Debug
    console.log('🔍 Submitting review with:', {
      dealId,
      offerId,
      author: formData.author_name,
    });

    startTransition(async () => {
      const result = await submitReview(formDataObj);

      if (result.success) {
        setSubmitStatus('success');

        const newReview: Comment = {
          id: Date.now(),
          user_id: null,
          article_id: null,
          offer_id: offerId ?? null,
          deal_id: dealId ?? null,
          type: 'review',
          author_name: formData.author_name,
          author_email: formData.author_email,
          content: formData.content,
          rating: formData.rating,
          ip_address: '',
          device_fingerprint: fingerprint,
          is_approved: true,
          created_at: new Date().toISOString(),
        };

        setReviews([newReview, ...reviews]);
        setFormData({ author_name: '', author_email: '', content: '', rating: 5 });
        setTimeout(() => setSubmitStatus('idle'), 3000);
      } else if (result.blocked) {
        setIsBlocked(true);
        setRemainingSeconds(result.remaining_seconds || 86400);
        setSubmitStatus('blocked');
      } else {
        setSubmitStatus('error');
        setErrorMessage(result.error || 'Failed to submit review');
      }
    });
  };

  return (
    <div className="mt-8 pt-8 border-t border-border-gray/60">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h3 className="text-xl font-bold text-navy">Reviews ({reviews.length})</h3>
        {reviews.length > 0 && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  size={16}
                  className={
                    star <= Math.round(averageRating)
                      ? 'fill-yellow text-yellow'
                      : 'text-gray-300'
                  }
                />
              ))}
            </div>
            <span className="text-sm font-bold text-navy">{averageRating.toFixed(1)}</span>
            <span className="text-xs text-gray-text">({reviews.length} reviews)</span>
          </div>
        )}
      </div>

      {/* Rating breakdown */}
      {reviews.length > 0 && (
        <div className="flex flex-wrap gap-3 mb-6">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = ratingCounts[star] || 0;
            const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
            return (
              <div key={star} className="flex items-center gap-2 text-sm">
                <div className="flex items-center gap-0.5">
                  <Star size={12} className="fill-yellow text-yellow" />
                  <span className="font-medium text-navy">{star}</span>
                </div>
                <div className="w-20 h-1.5 bg-gray-200 overflow-hidden">
                  <div className="h-full bg-yellow" style={{ width: `${percentage}%` }} />
                </div>
                <span className="text-xs text-gray-text">({count})</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Review list */}
      {reviews.length === 0 ? (
        <div className="text-center py-8 bg-light-gray/30 border border-border-gray/40">
          <p className="text-gray-text text-sm">No reviews yet. Be the first to leave a review!</p>
        </div>
      ) : (
        <div className="space-y-4 mb-4">
          {displayedReviews.map((review) => (
            <div
              key={review.id}
              className="bg-light-gray/40 p-5 border border-border-gray/40 hover:shadow-sm transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-navy text-white flex items-center justify-center font-bold text-sm border border-yellow">
                    {review.author_name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-bold text-navy text-sm">{review.author_name}</p>
                    <p className="text-xs text-gray-text">{formatDate(review.created_at)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      size={14}
                      className={
                        star <= (review.rating || 0)
                          ? 'fill-yellow text-yellow'
                          : 'text-gray-300'
                      }
                    />
                  ))}
                </div>
              </div>
              <p className="mt-3 text-sm text-gray-text leading-relaxed">{review.content}</p>
            </div>
          ))}
        </div>
      )}

      {/* See more */}
      {hasMoreReviews && (
        <button
          onClick={() => setIsPopupOpen(true)}
          className="mb-6 flex items-center justify-center gap-2 w-full py-2.5 border border-border-gray/50 text-sm font-bold text-navy hover:bg-light-gray/20 transition-colors"
        >
          See More Reviews ({reviews.length - 3} more)
        </button>
      )}

      {/* Blocked */}
      {isBlocked && (
        <div className="mb-6 p-4 bg-red-50/80 border border-red-200 flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 flex items-center justify-center flex-shrink-0">
              <Clock size={20} className="text-red-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-red-700">Temporarily Blocked</p>
              <p className="text-xs text-red-500">Too many attempts. Please wait.</p>
            </div>
          </div>
          <div className="ml-auto bg-white px-4 py-1.5 border border-red-200 shadow-sm">
            <span className="font-mono text-lg font-bold text-red-600 tracking-wider">
              {formatCountdown(remainingSeconds)}
            </span>
          </div>
        </div>
      )}

      {/* Submit form */}
      <form onSubmit={handleSubmit} className="bg-light-gray/30 p-6 border border-border-gray/40">
        <h4 className="font-bold text-navy text-sm mb-4">Leave a Review</h4>

        {submitStatus === 'success' && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 flex items-center gap-2 text-green-700 text-sm">
            <CheckCircle size={16} />
            Thank you! Your review has been submitted successfully.
          </div>
        )}

        {submitStatus === 'error' && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 flex items-center gap-2 text-red-700 text-sm">
            <AlertCircle size={16} />
            {errorMessage}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-text mb-1">Name *</label>
            <div className="relative">
              <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-text" />
              <input
                type="text"
                required
                disabled={isBlocked || isPending}
                placeholder="Your name"
                value={formData.author_name}
                onChange={(e) => setFormData({ ...formData, author_name: e.target.value })}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-border-gray text-sm focus:outline-none focus:border-navy focus:ring-2 focus:ring-navy/10 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-text mb-1">Email *</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-text" />
              <input
                type="email"
                required
                disabled={isBlocked || isPending}
                placeholder="your@email.com"
                value={formData.author_email}
                onChange={(e) => setFormData({ ...formData, author_email: e.target.value })}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-border-gray text-sm focus:outline-none focus:border-navy focus:ring-2 focus:ring-navy/10 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-xs font-semibold text-gray-text mb-1">Rating *</label>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                disabled={isBlocked || isPending}
                onClick={() => setFormData({ ...formData, rating: star })}
                className="p-1 hover:scale-110 transition-transform focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label={`Rate ${star} stars`}
              >
                <Star
                  size={28}
                  className={
                    star <= formData.rating
                      ? 'fill-yellow text-yellow'
                      : 'text-gray-300 hover:text-yellow/50 transition-colors'
                  }
                />
              </button>
            ))}
            <span className="ml-2 text-sm font-medium text-navy">{formData.rating} / 5</span>
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-xs font-semibold text-gray-text mb-1">Your Review *</label>
          <div className="relative">
            <MessageSquare size={16} className="absolute left-3 top-3 text-gray-text" />
            <textarea
              required
              disabled={isBlocked || isPending}
              placeholder={`Share your experience with this ${itemLabel}...`}
              rows={4}
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-border-gray text-sm focus:outline-none focus:border-navy focus:ring-2 focus:ring-navy/10 transition-all resize-none disabled:opacity-40 disabled:cursor-not-allowed"
              minLength={10}
              maxLength={2000}
            />
          </div>
          <div className="flex justify-end mt-1">
            <span className="text-xs text-gray-text">{formData.content.length}/2000</span>
          </div>
        </div>

        <button
          type="submit"
          disabled={isBlocked || isPending}
          className="mt-4 flex items-center justify-center gap-2 px-6 py-2.5 bg-yellow text-navy font-bold hover:bg-yellow-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed w-full sm:w-auto min-h-[44px] border border-yellow"
        >
          {isPending ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Submitting...
            </>
          ) : isBlocked ? (
            <>
              <Clock size={16} />
              Blocked ({formatCountdown(remainingSeconds)})
            </>
          ) : (
            <>
              Submit Review
              <Send size={16} />
            </>
          )}
        </button>

        <p className="text-xs text-gray-text mt-3 text-center">
          Your email will not be published. Required fields are marked *
        </p>
      </form>

      <ReviewsPopup
        reviews={reviews}
        isOpen={isPopupOpen}
        onClose={() => setIsPopupOpen(false)}
      />
    </div>
  );
}