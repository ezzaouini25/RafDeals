'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { 
  Star, ShieldCheck, X, Upload, MessageSquare, AlertCircle, 
  CheckCircle2, Clock, Loader2, DollarSign, User, Users,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Button from '@/components/ui/Button';
import { submitTestimonial, checkUserBlocked, getTestimonials } from '@/app/actions/testimonial';
import { generateDeviceFingerprint } from '@/lib/fingerprint';

interface Testimonial {
  id: number;
  author_name: string;
  gender: 'male' | 'female' | null;
  occupation: string;
  content: string;
  rating: number;
  payout_amount: string;
  payout_type: string;
  image_path: string | null;
  created_at: string;
}

const fallbackTestimonials: Testimonial[] = [
  {
    id: 1,
    author_name: 'Sarah Jenkins',
    gender: 'female',
    occupation: 'Stay-at-home Parent',
    content: 'Freecash has changed my free time entirely. I complete simple gaming milestones during the evening and cash out directly to my PayPal. I made $140 in my very first week!',
    rating: 5,
    payout_amount: '140.00',
    payout_type: 'first week',
    image_path: null,
    created_at: '2026-07-01'
  },
  {
    id: 2,
    author_name: 'Marcus Chen',
    gender: 'male',
    occupation: 'University Student',
    content: 'Thanks to the freelancing guides on EarnMoney, I set up a profile on Fiverr editing blog drafts. The recommendations here saved me from wasting hours on sketchy survey sites.',
    rating: 5,
    payout_amount: '450.00',
    payout_type: 'per month part-time',
    image_path: null,
    created_at: '2026-07-05'
  },
  {
    id: 3,
    author_name: 'Emily Henderson',
    gender: 'female',
    occupation: 'Digital Marketer',
    content: 'I love Swagbucks for quick cashback. By following EarnMoneys tip to register a dedicated email, my personal inbox stays completely clutter-free while I rack up Amazon rewards!',
    rating: 5,
    payout_amount: '85.00',
    payout_type: 'in gift cards',
    image_path: null,
    created_at: '2026-07-10'
  }
];

// ✅ 12 Female avatars
const femaleAvatars = [
  '/img/testimonials/female-01.jpeg', '/img/testimonials/female-02.jpeg',
  '/img/testimonials/female-03.jpeg', '/img/testimonials/female-04.jpeg',
  '/img/testimonials/female-05.jpeg', '/img/testimonials/female-06.jpeg',
  '/img/testimonials/female-07.jpeg', '/img/testimonials/female-08.jpeg',
  '/img/testimonials/female-09.jpeg', '/img/testimonials/female-10.jpeg',
  '/img/testimonials/female-11.jpeg', '/img/testimonials/female-12.jpeg',
];

// ✅ 12 Male avatars
const maleAvatars = [
  '/img/testimonials/male-01.jpeg', '/img/testimonials/male-02.jpeg',
  '/img/testimonials/male-03.jpeg', '/img/testimonials/male-04.jpeg',
  '/img/testimonials/male-05.jpeg', '/img/testimonials/male-06.jpeg',
  '/img/testimonials/male-07.jpeg', '/img/testimonials/male-08.jpeg',
  '/img/testimonials/male-09.jpeg', '/img/testimonials/male-10.jpeg',
  '/img/testimonials/male-11.jpeg', '/img/testimonials/male-12.jpeg',
];

const payoutTypes = [
  'first week', 'first month', 'per month part-time', 'per month full-time',
  'in gift cards', 'in crypto', 'per day', 'per week', 'per hour',
  'bonus', 'signup bonus', 'referral bonus',
];

const getConsistentAvatar = (name: string, gender: 'male' | 'female' | null): string => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % 12;

  if (gender === 'female') return femaleAvatars[index];
  if (gender === 'male') return maleAvatars[index];
  return hash % 2 === 0 ? femaleAvatars[index] : maleAvatars[index];
};

export default function Testimonials() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>(fallbackTestimonials);
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [occupation, setOccupation] = useState('');
  const [rating, setRating] = useState(5);
  const [message, setMessage] = useState('');
  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutType, setPayoutType] = useState('');
  const [proofImage, setProofImage] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [captchaAnswer, setCaptchaAnswer] = useState('');
  const [captchaOps, setCaptchaOps] = useState({ num1: 0, num2: 0 });
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [fingerprint, setFingerprint] = useState('');
  const [isBlocked, setIsBlocked] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(0);

  // --- CAROUSEL STATE ---
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [windowWidth, setWindowWidth] = useState(1200);

  // ✅ Track window width for responsive slider
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const fetchTestimonials = async () => {
      try {
        const data = await getTestimonials();
        if (data && data.length > 0) {
          setTestimonials(data);
        }
      } catch (error) {
        console.error('Failed to fetch testimonials:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTestimonials();
  }, []);

  useEffect(() => {
    try {
      const fp = generateDeviceFingerprint();
      setFingerprint(fp);
    } catch (error) {
      console.error('Failed to generate fingerprint:', error);
    }
  }, []);

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
      }
    };

    checkStatus();
  }, [fingerprint]);

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

  const displayTestimonials = testimonials.slice(0, 15);

  // ✅ Determine how many cards to show per screen
  const cardsPerScreen = windowWidth >= 1024 ? 3 : windowWidth >= 768 ? 2 : 1;

  // ✅ Check if we have enough data to slide
  const canSlide = displayTestimonials.length > cardsPerScreen;

  // ✅ Auto-slide logic - only if there are enough cards
  useEffect(() => {
    if (!canSlide || isPaused) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % displayTestimonials.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [canSlide, isPaused, displayTestimonials.length]);

  const formatCountdown = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const refreshCaptcha = () => {
    const num1 = Math.floor(Math.random() * 9) + 1;
    const num2 = Math.floor(Math.random() * 9) + 1;
    setCaptchaOps({ num1, num2 });
    setCaptchaAnswer('');
  };

  const handleOpenModal = () => {
    setIsOpen(true);
    refreshCaptcha();
    setFormError('');
    setSubmitSuccess(null);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProofImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProofPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setIsSubmitting(true);

    if (isBlocked) {
      setFormError('You are blocked. Please wait before submitting again.');
      setIsSubmitting(false);
      return;
    }

    const expected = captchaOps.num1 + captchaOps.num2;
    if (Number(captchaAnswer.trim()) !== expected) {
      setFormError('Incorrect CAPTCHA answer. Please try again.');
      setIsSubmitting(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('gender', gender);
      formData.append('occupation', occupation);
      formData.append('rating', String(rating));
      formData.append('message', message);
      formData.append('payoutAmount', payoutAmount);
      formData.append('payoutType', payoutType);
      formData.append('device_fingerprint', fingerprint);
      if (proofImage) {
        formData.append('proofImage', proofImage);
      }

      const result = await submitTestimonial(formData);

      if (result.success) {
        setSubmitSuccess(result.message || 'Your testimonial has been submitted successfully!');
        setName('');
        setGender('male');
        setOccupation('');
        setRating(5);
        setMessage('');
        setPayoutAmount('');
        setPayoutType('');
        setProofImage(null);
        setProofPreview(null);
        setCaptchaAnswer('');
        
        const data = await getTestimonials();
        if (data && data.length > 0) {
          setTestimonials(data);
        }
      } else if (result.blocked) {
        setIsBlocked(true);
        setRemainingSeconds(result.remaining_seconds || 86400);
        setFormError(result.error || 'You have been blocked for 24 hours.');
      } else {
        setFormError(result.error || 'Failed to submit.');
      }
    } catch (err) {
      setFormError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextSlide = () => {
    if (!canSlide) return;
    setCurrentIndex((prev) => (prev + 1) % displayTestimonials.length);
  };

  const prevSlide = () => {
    if (!canSlide) return;
    setCurrentIndex((prev) => (prev - 1 + displayTestimonials.length) % displayTestimonials.length);
  };

  return (
    <section className="py-20 bg-light-gray overflow-hidden" id="testimonials">
      <div className="max-w-container mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-extrabold text-navy/50 tracking-widest uppercase">
            Community Feedback
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-navy tracking-tight mt-3 leading-tight">
            What Our Community Says.
          </h2>
          <p className="mt-4 text-gray-text text-base leading-relaxed">
            See what everyday people are saying about their experience finding verified online offers and exclusive deals on RafDeals.
          </p>
          <div className="mt-6">
            <Button
              onClick={handleOpenModal}
              variant="primary"
              disabled={isBlocked}
              className="inline-flex items-center gap-2 px-6 shadow-md shadow-navy/10 hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isBlocked ? (
                <>
                  <Clock size={16} />
                  Blocked ({formatCountdown(remainingSeconds)})
                </>
              ) : (
                <>
                  <MessageSquare size={16} />
                  Share Your Story
                </>
              )}
            </Button>
          </div>
        </div>

        {/* SLIDER SECTION */}
        <div 
          className="relative"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {/* ✅ Arrows - Only show if there are more items than fit on screen */}
          {canSlide && (
            <>
              <button 
                onClick={prevSlide}
                aria-label="Previous testimonial"
                className="absolute top-1/2 -left-2 sm:-left-4 lg:-left-8 -translate-y-1/2 w-10 h-10 bg-white items-center justify-center shadow-md border border-border-gray text-navy hover:bg-yellow hover:border-yellow transition-colors z-20 flex"
              >
                <ChevronLeft size={24} />
              </button>
              <button 
                onClick={nextSlide}
                aria-label="Next testimonial"
                className="absolute top-1/2 -right-2 sm:-right-4 lg:-right-8 -translate-y-1/2 w-10 h-10 bg-white items-center justify-center shadow-md border border-border-gray text-navy hover:bg-yellow hover:border-yellow transition-colors z-20 flex"
              >
                <ChevronRight size={24} />
              </button>
            </>
          )}

          {/* Slider Track */}
          <div className="overflow-hidden -mx-4 px-4 py-4">
            <div 
              className="flex transition-transform duration-700 ease-in-out"
              style={{ transform: `translateX(-${currentIndex * (100 / cardsPerScreen)}%)` }}
            >
              {displayTestimonials.map((t) => {
                const avatar = t.image_path || getConsistentAvatar(t.author_name, t.gender);
                const displayPayout = t.payout_amount && t.payout_type 
                  ? `${t.payout_amount} ${t.payout_type}` 
                  : t.payout_amount || '';
                
                return (
                  <div 
                    key={t.id} 
                    className="w-full md:w-1/2 lg:w-1/3 shrink-0 px-3 sm:px-4"
                  >
                    <div className="bg-white rounded-card border border-border-gray/60 p-6 md:p-8 flex flex-col justify-between shadow-sm hover:shadow-card h-full transition-all duration-300">
                      <div>
                        {/* Stars with Rating Number */}
                        <div className="flex items-center justify-between mb-6">
                          <div className="flex items-center gap-2">
                            <div className="flex gap-0.5">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star 
                                  key={star} 
                                  size={16} 
                                  fill={star <= Math.round(t.rating) ? 'currentColor' : 'none'} 
                                  className={star <= Math.round(t.rating) ? 'text-yellow' : 'text-gray-300'} 
                                />
                              ))}
                            </div>
                            <span className="text-xs font-bold text-navy">
                              {Math.round(t.rating)} / 5
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-sm">
                            <ShieldCheck size={14} className="text-emerald-500" />
                            <span>Verified Earner</span>
                          </div>
                        </div>

                        {/* Content */}
                        <p className="text-gray-text text-sm sm:text-base leading-relaxed italic line-clamp-6">
                          &ldquo;{t.content}&rdquo;
                        </p>
                      </div>

                      {/* Author Footer */}
                      <div className="flex items-center gap-4 mt-8 pt-6 border-t border-border-gray/40">
                        <div className="relative w-12 h-12 rounded-sm overflow-hidden shrink-0 border-2 border-border-gray bg-light-gray">
                          <Image
                            src={avatar}
                            alt={t.author_name}
                            fill
                            className="object-cover"
                            referrerPolicy="no-referrer"
                            sizes="48px"
                          />
                        </div>
                        <div>
                          <h4 className="font-bold text-navy text-sm leading-tight">{t.author_name}</h4>
                          <p className="text-xs text-gray-text mt-0.5">{t.occupation}</p>
                          {displayPayout && (
                            <p className="text-[11px] font-extrabold text-navy bg-yellow/20 px-2 py-0.5 rounded-sm inline-block mt-2">
                              +${displayPayout}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* ✅ Dots - Only show if there are more items than fit on screen */}
          {canSlide && (
            <div className="flex justify-center gap-2 mt-8">
              {displayTestimonials.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`transition-all duration-300 rounded-sm ${
                    currentIndex === idx ? 'w-6 h-2.5 bg-navy' : 'w-2.5 h-2.5 bg-navy/20 hover:bg-navy/40'
                  }`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Share Story Popup Modal (Unchanged) */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-navy/60 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-lg bg-white rounded-none overflow-hidden shadow-2xl border border-border-gray max-h-[90vh] flex flex-col z-10"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-border-gray/60 bg-light-gray/50 shrink-0">
                <div className="flex items-center gap-2">
                  <MessageSquare className="text-navy" size={20} />
                  <h3 className="font-extrabold text-navy text-lg">Share Your Story</h3>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-text hover:text-navy p-1 transition-colors rounded-none hover:bg-border-gray/40"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-6 overflow-y-auto flex-1">
                {isBlocked && (
                  <div className="mb-4 p-3 bg-red-50/80 border border-red-200 rounded-none flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <AlertCircle size={16} className="text-red-500" />
                      <span className="text-sm font-medium text-red-700">Blocked</span>
                      <span className="text-xs text-red-500">•</span>
                      <span className="text-xs text-red-500">Please wait</span>
                    </div>
                    <div className="bg-white px-3 py-1 rounded-none border border-red-200">
                      <span className="font-mono text-sm font-bold text-red-600">
                        {formatCountdown(remainingSeconds)}
                      </span>
                    </div>
                  </div>
                )}

                {submitSuccess ? (
                  <div className="text-center py-8">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-emerald-100 text-emerald-600 rounded-none mb-4">
                      <CheckCircle2 size={24} />
                    </div>
                    <h4 className="text-lg font-bold text-navy mb-2">Thank You!</h4>
                    <p className="text-sm text-gray-text max-w-sm mx-auto leading-relaxed">{submitSuccess}</p>
                    <div className="mt-8">
                      <Button onClick={() => setIsOpen(false)} variant="primary">Close</Button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {formError && (
                      <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-none flex items-start gap-2">
                        <AlertCircle className="shrink-0 text-red-500 mt-0.5" size={14} />
                        <span>{formError}</span>
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-1.5">Your Name *</label>
                      <input
                        type="text"
                        required
                        disabled={isBlocked}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. John Doe"
                        className="w-full px-4 py-2.5 rounded-none border border-border-gray focus:outline-none focus:ring-2 focus:ring-navy/25 focus:border-navy text-sm text-navy disabled:opacity-40 disabled:cursor-not-allowed"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-1.5">Gender *</label>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="gender"
                            value="male"
                            checked={gender === 'male'}
                            onChange={() => setGender('male')}
                            disabled={isBlocked}
                            className="w-4 h-4 accent-navy"
                          />
                          <User size={16} className="text-navy" />
                          <span className="text-sm text-navy">Male</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="gender"
                            value="female"
                            checked={gender === 'female'}
                            onChange={() => setGender('female')}
                            disabled={isBlocked}
                            className="w-4 h-4 accent-navy"
                          />
                          <Users size={16} className="text-navy" />
                          <span className="text-sm text-navy">Female</span>
                        </label>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-1.5">Your Occupation *</label>
                      <select
                        required
                        disabled={isBlocked}
                        value={occupation}
                        onChange={(e) => setOccupation(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-none border border-border-gray focus:outline-none focus:ring-2 focus:ring-navy/25 focus:border-navy text-sm text-navy bg-white disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <option value="">Select your occupation</option>
                        <option value="Student">Student</option>
                        <option value="Freelancer">Freelancer</option>
                        <option value="Full-time Employee">Full-time Employee</option>
                        <option value="Part-time Employee">Part-time Employee</option>
                        <option value="Self-employed">Self-employed</option>
                        <option value="Stay-at-home Parent">Stay-at-home Parent</option>
                        <option value="Retired">Retired</option>
                        <option value="Unemployed">Unemployed</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-1.5">How much did you earn? *</label>
                      <div className="relative">
                        <DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-text" />
                        <input
                          type="text"
                          required
                          disabled={isBlocked}
                          value={payoutAmount}
                          onChange={(e) => setPayoutAmount(e.target.value)}
                          placeholder="e.g. +$140.00"
                          className="w-full pl-10 pr-4 py-2.5 rounded-none border border-border-gray focus:outline-none focus:ring-2 focus:ring-navy/25 focus:border-navy text-sm text-navy disabled:opacity-40 disabled:cursor-not-allowed"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-1.5">Payout Type *</label>
                      <select
                        required
                        disabled={isBlocked}
                        value={payoutType}
                        onChange={(e) => setPayoutType(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-none border border-border-gray focus:outline-none focus:ring-2 focus:ring-navy/25 focus:border-navy text-sm text-navy bg-white disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <option value="">Select payout type</option>
                        {payoutTypes.map((type) => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-1.5">Rating *</label>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            disabled={isBlocked}
                            onClick={() => setRating(star)}
                            className="p-1 text-yellow-500 hover:scale-110 transition-transform disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            <Star
                              size={24}
                              fill={star <= rating ? 'currentColor' : 'none'}
                              className={star <= rating ? 'text-yellow' : 'text-gray-300'}
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-1.5">Your Message *</label>
                      <textarea
                        required
                        disabled={isBlocked}
                        rows={3}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Tell us about your experience..."
                        className="w-full px-4 py-2.5 rounded-none border border-border-gray focus:outline-none focus:ring-2 focus:ring-navy/25 focus:border-navy text-sm text-navy resize-none disabled:opacity-40 disabled:cursor-not-allowed"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-1.5">Payment Proof (Optional)</label>
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                        <label className={`flex flex-col items-center justify-center px-4 py-3 border border-dashed border-border-gray hover:border-navy bg-light-gray/40 rounded-none cursor-pointer transition-colors w-full sm:w-auto ${isBlocked ? 'opacity-40 cursor-not-allowed' : ''}`}>
                          <Upload className="text-gray-text mb-1" size={16} />
                          <span className="text-[11px] font-bold text-navy">Choose file</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            className="hidden"
                            disabled={isBlocked}
                          />
                        </label>
                        {proofPreview && (
                          <div className="relative w-16 h-16 border border-border-gray rounded-none overflow-hidden bg-light-gray shrink-0">
                            <Image
                              src={proofPreview}
                              alt="Proof preview"
                              fill
                              className="object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setProofImage(null);
                                setProofPreview(null);
                              }}
                              className="absolute top-0.5 right-0.5 bg-navy/80 text-white rounded-none p-0.5 hover:bg-navy"
                            >
                              <X size={10} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="bg-light-gray/50 p-4 rounded-none border border-border-gray/80">
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-xs font-bold text-navy uppercase tracking-wider">Are you a human? Solve: *</label>
                        <button
                          type="button"
                          onClick={refreshCaptcha}
                          disabled={isBlocked}
                          className="text-[11px] font-bold text-navy hover:underline disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          Refresh
                        </button>
                      </div>
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                        <span className="text-sm font-extrabold text-navy tracking-wide bg-white px-3 py-1.5 rounded-none border border-border-gray/60 shadow-sm">
                          {captchaOps.num1} + {captchaOps.num2} = ?
                        </span>
                        <input
                          type="text"
                          required
                          disabled={isBlocked}
                          value={captchaAnswer}
                          onChange={(e) => setCaptchaAnswer(e.target.value)}
                          placeholder="Answer"
                          className="w-full sm:w-24 px-3 py-1.5 rounded-none border border-border-gray focus:outline-none focus:ring-2 focus:ring-navy/25 text-sm text-navy font-bold text-center disabled:opacity-40 disabled:cursor-not-allowed"
                        />
                      </div>
                    </div>

                    <div className="pt-2">
                      <Button
                        type="submit"
                        disabled={isBlocked || isSubmitting}
                        className="w-full py-2.5 text-sm font-bold shadow-lg"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 size={16} className="animate-spin mr-2" />
                            Submitting...
                          </>
                        ) : isBlocked ? (
                          <>
                            <Clock size={16} className="mr-2" />
                            Blocked ({formatCountdown(remainingSeconds)})
                          </>
                        ) : (
                          'Submit Testimonial'
                        )}
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}