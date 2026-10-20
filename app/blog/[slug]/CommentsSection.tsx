'use client';

import { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  Send, 
  User, 
  ChevronDown, 
  ChevronUp, 
  Clock, 
  Loader2, 
  AlertCircle, 
  Mail 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Comment } from '@/types';
import Button from '@/components/ui/Button';
import { submitComment, checkUserBlocked } from '@/app/actions/comment';
import { formatDate } from '@/lib/utils';
import { generateDeviceFingerprint } from '@/lib/fingerprint';

interface CommentsSectionProps {
  articleSlug: string;
  initialComments: Comment[];
}

export default function CommentsSection({ articleSlug, initialComments }: CommentsSectionProps) {
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [showAll, setShowAll] = useState(false);
  const [author_name, setAuthorName] = useState('');
  const [author_email, setAuthorEmail] = useState('');
  const [content, setContent] = useState('');
  const [captchaAnswer, setCaptchaAnswer] = useState('');
  const [captchaOps, setCaptchaOps] = useState(() => {
    const num1 = Math.floor(Math.random() * 9) + 1;
    const num2 = Math.floor(Math.random() * 9) + 1;
    return { num1, num2 };
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [fingerprint, setFingerprint] = useState('');
  const [isBlocked, setIsBlocked] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Generate fingerprint on mount
  useEffect(() => {
    try {
      const fp = generateDeviceFingerprint();
      setFingerprint(fp);
    } catch (error) {
      console.error('Failed to generate fingerprint:', error);
    }
  }, []);

  // Check block status on mount
  useEffect(() => {
    if (!fingerprint) return;

    const checkStatus = async () => {
      try {
        const result = await checkUserBlocked(fingerprint);
        if (result.blocked) {
          setIsBlocked(true);
          setRemainingSeconds(result.remaining_seconds || 86400);
        }
      } catch (error) {
        console.error('Failed to check block status:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkStatus();
  }, [fingerprint]);

  // Countdown timer
  useEffect(() => {
    if (!isBlocked || remainingSeconds <= 0) return;

    const timer = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          setIsBlocked(false);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isBlocked, remainingSeconds]);

  const refreshCaptcha = () => {
    const num1 = Math.floor(Math.random() * 9) + 1;
    const num2 = Math.floor(Math.random() * 9) + 1;
    setCaptchaOps({ num1, num2 });
    setCaptchaAnswer('');
  };

  const formatCountdown = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // ✅ SHOW ONLY 3 COMMENTS INITIALLY
  const displayedComments = showAll ? comments : comments.slice(0, 3);
  const hasMoreComments = comments.length > 3;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (isBlocked) {
      setError('You are blocked. Please wait before submitting again.');
      return;
    }

    if (!author_name.trim() || !author_email.trim() || !content.trim()) {
      setError('Please fill in your name, email, and comment message.');
      return;
    }

    const expected = captchaOps.num1 + captchaOps.num2;
    if (Number(captchaAnswer.trim()) !== expected) {
      setError('Incorrect CAPTCHA answer. Please try again.');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await submitComment(articleSlug, author_name, content, author_email, fingerprint);
      if (result.success) {
        const newComment: Comment = {
          id: comments.length + 1,
          user_id: null,
          article_id: null,
          offer_id: null,
          type: 'comment',
          author_name: author_name.trim(),
          author_email: author_email.trim(),
          content: content.trim(),
          rating: null,
          ip_address: '',
          device_fingerprint: fingerprint,
          is_approved: true,
          created_at: new Date().toISOString(),
        };
        setComments([newComment, ...comments]);
        setAuthorName('');
        setAuthorEmail('');
        setContent('');
        refreshCaptcha();
        setSuccess(true);
        setTimeout(() => setSuccess(false), 5000);
      } else if (result.blocked) {
        setIsBlocked(true);
        setRemainingSeconds(result.remaining_seconds || 86400);
        setError(result.error || 'You have been blocked for 24 hours.');
      } else {
        setError(result.error || 'Failed to submit comment.');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const colors = [
    'bg-blue-100 text-blue-700',
    'bg-amber-100 text-amber-700',
    'bg-emerald-100 text-emerald-700',
    'bg-indigo-100 text-indigo-700',
    'bg-purple-100 text-yellow-600',
  ];

  const getColorClass = (name: string) => {
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  return (
    <div className="mt-12 pt-12 border-t border-border-gray/60" id="comments-section">
      <div className="flex items-center gap-3 mb-8">
        <MessageSquare className="text-navy" size={24} />
        <h3 className="text-xl sm:text-2xl font-extrabold text-navy tracking-tight">
          Discussion ({comments.length})
        </h3>
      </div>

      {/* Blocked Message */}
      {isBlocked && (
        <div className="mb-6 flex items-center justify-between gap-3 p-3 bg-red-50/80 border border-red-200 flex-wrap">
          <div className="flex items-center gap-2.5">
            <AlertCircle size={18} className="text-red-500 flex-shrink-0" />
            <span className="text-sm font-medium text-red-700">Blocked</span>
            <span className="text-xs text-red-500">•</span>
            <span className="text-xs text-red-500">Please wait</span>
          </div>
          <div className="bg-white px-3 py-1 border border-red-200">
            <span className="font-mono text-base font-bold text-red-600">
              {formatCountdown(remainingSeconds)}
            </span>
          </div>
        </div>
      )}

      {/* ✅ COMMENTS LIST - NO SCROLLBAR, SHOW 3 INITIALLY */}
      {comments.length === 0 ? (
        <div className="bg-light-gray/40 p-6 text-center border border-border-gray/30 mb-8">
          <p className="text-gray-text text-sm font-medium">No comments yet. Start the conversation below!</p>
        </div>
      ) : (
        <div className="space-y-4 mb-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
          <AnimatePresence initial={false}>
            {displayedComments.map((comment, index) => (
              <motion.div
                key={comment.id || index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="bg-light-gray/40 p-5 border border-border-gray/40 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 shrink-0 font-bold flex items-center justify-center text-sm border border-border-gray/40 ${getColorClass(comment.author_name)}`}>
                      {getInitials(comment.author_name) || <User size={16} />}
                    </div>
                    <div>
                      <p className="font-bold text-navy text-sm">{comment.author_name}</p>
                      <p className="text-xs text-gray-text">{formatDate(comment.created_at)}</p>
                    </div>
                  </div>
                </div>
                <p className="mt-3 text-sm text-gray-text leading-relaxed">
                  {comment.content}
                </p>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* ✅ SHOW MORE BUTTON - EXPANDS TO SHOW ALL */}
          {hasMoreComments && (
            <div className="text-center pt-2">
              <button
                onClick={() => setShowAll(!showAll)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-light-gray border border-border-gray text-navy text-xs font-bold transition-colors cursor-pointer"
              >
                {showAll ? (
                  <>
                    Show Less <ChevronUp size={14} />
                  </>
                ) : (
                  <>
                    Show More ({comments.length - 3} more) <ChevronDown size={14} />
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Add Comment Form */}
      <div className="bg-light-gray/30 p-6 border border-border-gray/40">
        <h4 className="font-bold text-navy text-sm mb-4">Leave a Comment</h4>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
              {error}
            </div>
          )}

          {success && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
              Your comment has been posted successfully!
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-text mb-1">Name *</label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-text" />
                <input
                  type="text"
                  id="comment-author"
                  required
                  disabled={isBlocked}
                  value={author_name}
                  onChange={(e) => setAuthorName(e.target.value)}
                  placeholder="Your name"
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
                  id="comment-email"
                  required
                  disabled={isBlocked}
                  value={author_email}
                  onChange={(e) => setAuthorEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-border-gray text-sm focus:outline-none focus:border-navy focus:ring-2 focus:ring-navy/10 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-xs font-semibold text-gray-text mb-1">Your Comment *</label>
            <div className="relative">
              <MessageSquare size={16} className="absolute left-3 top-3 text-gray-text" />
              <textarea
                id="comment-text"
                required
                disabled={isBlocked}
                rows={4}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Share your thoughts..."
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-border-gray text-sm focus:outline-none focus:border-navy focus:ring-2 focus:ring-navy/10 transition-all resize-none disabled:opacity-40 disabled:cursor-not-allowed"
                minLength={10}
                maxLength={2000}
              />
            </div>
            <div className="flex justify-end mt-1">
              <span className="text-xs text-gray-text">{content.length}/2000</span>
            </div>
          </div>

          <div className="bg-white p-4 border border-border-gray/50 max-w-sm">
            <label className="block text-xs font-semibold text-gray-text mb-1">Spam Protection CAPTCHA</label>
            <div className="flex items-center gap-3">
              <span className="px-3 py-1.5 bg-light-gray font-mono text-navy font-bold border border-border-gray/40 select-none text-sm">
                {captchaOps.num1} + {captchaOps.num2} =
              </span>
              <input
                type="number"
                id="comment-captcha"
                required
                disabled={isBlocked}
                value={captchaAnswer}
                onChange={(e) => setCaptchaAnswer(e.target.value)}
                placeholder="Answer"
                className="w-24 px-3 py-1.5 border border-border-gray focus:outline-none focus:ring-2 focus:ring-navy/25 focus:border-navy text-sm text-navy font-bold bg-white disabled:opacity-40 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              disabled={isBlocked || isSubmitting}
              className="inline-flex items-center gap-2 font-bold px-6 py-2.5 bg-yellow text-navy hover:bg-yellow-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed border border-yellow"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Posting...
                </>
              ) : isBlocked ? (
                <>
                  <Clock size={14} />
                  Blocked ({formatCountdown(remainingSeconds)})
                </>
              ) : (
                <>
                  <Send size={14} />
                  Post Comment
                </>
              )}
            </Button>
          </div>
          
          <p className="text-xs text-gray-text mt-3 text-center">
            Your email will not be published. Required fields are marked *
          </p>
        </form>
      </div>
    </div>
  );
}