'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Cookie, X } from 'lucide-react';
import { saveCookieConsent } from '@/app/actions/cookie';
import Button from '@/components/ui/Button';

export default function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user has already made a choice
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) {
      // Delay presentation slightly for better user experience
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleChoice = async (choice: 'accepted' | 'rejected') => {
    setIsVisible(false);
    localStorage.setItem('cookie-consent', choice);
    
    // Save to server/database
    const userAgent = typeof window !== 'undefined' ? window.navigator.userAgent : undefined;
    await saveCookieConsent(choice, userAgent);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          id="cookie-consent-banner"
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 150 }}
          className="fixed bottom-6 left-6 right-6 md:left-auto md:right-6 md:max-w-md z-50"
        >
          <div className="bg-white border border-border-gray shadow-xl rounded-card p-6 flex flex-col gap-4 relative">
            <button
              onClick={() => handleChoice('rejected')}
              className="absolute top-4 right-4 text-gray-text hover:text-navy transition-colors min-h-[32px] min-w-[32px] flex items-center justify-center rounded-full hover:bg-light-gray"
              aria-label="Close consent popup"
            >
              <X size={16} />
            </button>
            
            <div className="flex items-start gap-3.5 pr-6">
              <div className="p-2.5 bg-yellow/10 text-yellow rounded-full shrink-0">
                <Cookie size={22} className="text-navy" />
              </div>
              <div>
                <h3 className="font-bold text-navy text-base">We Use Cookies</h3>
                <p className="text-xs text-gray-text mt-1 leading-relaxed">
                  We use cookies to optimize your browsing experience, analyze site traffic, and deliver personalized content. By clicking &quot;Accept All&quot;, you agree to our use of cookies.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-1.5 border-t border-border-gray/50">
              <button
                onClick={() => handleChoice('rejected')}
                className="px-4 py-2 text-xs font-semibold text-gray-text hover:text-navy hover:bg-light-gray rounded-btn transition-all min-h-[40px]"
              >
                Reject All
              </button>
              
              {/* Use button variant black to turn white on hover, or primary variant */}
              <Button
                variant="black"
                size="sm"
                onClick={() => handleChoice('accepted')}
                className="text-xs font-bold min-h-[40px] px-5"
              >
                Accept All
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
