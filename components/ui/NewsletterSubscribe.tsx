'use client';

import { useState, useEffect } from 'react';
import { Mail, Check, X, CheckCircle2, AlertCircle, Clock, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Button from '@/components/ui/Button';
import { subscribeNewsletter, checkSubscriptionBlock } from '@/app/actions/subscription';
import { generateDeviceFingerprint } from '@/lib/fingerprint';

export default function NewsletterSubscribe() {
  const [email, setEmail] = useState('');
  const [submittedEmail, setSubmittedEmail] = useState(''); // Store email for modal
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [modalTitle, setModalTitle] = useState('');
  const [modalType, setModalType] = useState<'success' | 'error' | 'blocked'>('success');

  // Rate limiting states
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
        const result = await checkSubscriptionBlock(fingerprint);
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

  const formatCountdown = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isBlocked) {
      setError(`You are blocked. Please wait ${formatCountdown(remainingSeconds)} before subscribing.`);
      return;
    }

    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await subscribeNewsletter(email, fingerprint);

      if (result.success) {
        setSubmittedEmail(email); // Save email for modal display
        setModalType('success');
        setModalTitle('Subscription Confirmed!');
        setModalMessage('You are now subscribed! You\'ll receive new offers and articles by email.');
        setIsOpen(true);
        setEmail('');
      } else if (result.blocked) {
        setIsBlocked(true);
        setRemainingSeconds(result.remaining_seconds || 86400);
        setModalType('blocked');
        setModalTitle('Temporarily Blocked');
        setModalMessage(result.error || 'You have been blocked from subscribing for 24 hours.');
        setIsOpen(true);
      } else if (result.duplicate) {
        setModalType('error');
        setModalTitle('Already Subscribed');
        setModalMessage('This email is already subscribed to our newsletter.');
        setIsOpen(true);
      } else {
        setError(result.error || 'Failed to subscribe. Please try again.');
      }
    } catch (error) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setSubmittedEmail('');
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
        <div className="flex-1 relative">
          <input
            type="email"
            value={email}
            disabled={isBlocked || isSubmitting}
            onChange={(e) => {
              setEmail(e.target.value);
              if (error) setError('');
            }}
            placeholder="Enter your email"
            className="w-full min-h-[44px] px-4 py-2 text-sm border border-white/20 rounded-input bg-white/10 text-white placeholder:text-gray-400 focus:outline-none focus:border-yellow focus:ring-1 focus:ring-yellow disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Newsletter email input"
          />
          {error && <p className="absolute left-0 -bottom-5 text-[10px] font-semibold text-yellow">{error}</p>}
        </div>
        <button
          type="submit"
          disabled={isBlocked || isSubmitting}
          className="px-5 py-2.5 min-h-[44px] bg-yellow text-navy text-sm font-semibold rounded-btn hover:bg-yellow-hover transition-colors flex items-center justify-center cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed gap-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Subscribing...
            </>
          ) : isBlocked ? (
            <>
              <Clock size={16} />
              Blocked ({formatCountdown(remainingSeconds)})
            </>
          ) : (
            'Subscribe'
          )}
        </button>
      </form>

      {/* Subscription Modal */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleClose}
              className="absolute inset-0 bg-navy/60 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-md bg-white rounded-2xl p-8 text-center shadow-2xl border border-border-gray z-10"
            >
              <button
                onClick={handleClose}
                className="absolute top-4 h-8 w-8 right-4 text-gray-text hover:text-navy p-1 transition-colors rounded-full hover:bg-border-gray/40 flex items-center justify-center"
                aria-label="Close modal"
              >
                <X size={16} />
              </button>

              {modalType === 'success' && (
                <div className="inline-flex items-center justify-center w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full mb-5">
                  <CheckCircle2 size={28} />
                </div>
              )}

              {modalType === 'error' && (
                <div className="inline-flex items-center justify-center w-14 h-14 bg-amber-50 text-amber-600 rounded-full mb-5">
                  <AlertCircle size={28} />
                </div>
              )}

              {modalType === 'blocked' && (
                <div className="inline-flex items-center justify-center w-14 h-14 bg-red-50 text-red-600 rounded-full mb-5">
                  <Clock size={28} />
                </div>
              )}

              <h3 className="font-extrabold text-navy text-xl tracking-tight mb-2">
                {modalTitle}
              </h3>
              
              <p className="text-gray-text text-sm leading-relaxed mb-6">
                {modalMessage}
              </p>

              {modalType === 'blocked' && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6">
                  <span className="font-mono text-lg font-bold text-red-600">
                    {formatCountdown(remainingSeconds)}
                  </span>
                  <p className="text-xs text-red-500 mt-1">remaining until you can subscribe again</p>
                </div>
              )}

              {modalType === 'success' && submittedEmail && (
                <div className="text-xs text-gray-text font-medium bg-light-gray rounded-lg p-3 border border-border-gray/40 mb-6">
                  Sent to: <span className="font-bold text-navy font-mono">{submittedEmail}</span>
                </div>
              )}

              <Button onClick={handleClose} variant="primary" className="w-full py-2.5 font-bold">
                {modalType === 'blocked' ? 'Got it' : 'Awesome, thank you!'}
              </Button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}