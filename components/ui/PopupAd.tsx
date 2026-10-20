'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { X } from 'lucide-react';

interface Sponsor {
  id: number;
  name: string;
  size: string;
  code: string;
  is_active: boolean;
  is_boosted: boolean;
  impressions: number;
  clicks: number;
}

// ============================================================
// COOKIE HELPERS (localStorage)
// ============================================================

const getCookie = (key: string): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(key);
};

const setCookie = (key: string, value: string): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, value);
};

// ============================================================
// PopupAd COMPONENT
// ============================================================

export default function PopupAd() {
  const [sponsor, setSponsor] = useState<Sponsor | null>(null);
  const [loading, setLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const [isClosed, setIsClosed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isMounted = useRef(true);
  const hasTrackedImpression = useRef(false);

  // ============================================================
  // FETCH POPUP SPONSOR
  // ============================================================

  useEffect(() => {
    isMounted.current = true;

    const fetchPopupSponsor = async () => {
      try {
        console.log('🔍 Fetching popup sponsor...');
        
        const res = await fetch(`/api/public/sponsor?placement=popup&_=${Date.now()}`, {
          cache: 'no-store'
        });
        
        console.log('📡 Response status:', res.status);
        
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        
        const data = await res.json();
        console.log('📦 Data received:', data);
        
        if (isMounted.current && data.sponsor) {
          console.log('✅ Sponsor found:', data.sponsor.name, 'Size:', data.sponsor.size, 'Active:', data.sponsor.is_active);
          
          if (data.sponsor.is_active === 1 && data.sponsor.size === 'popup') {
            setSponsor(data.sponsor);
            console.log('🎯 Valid popup sponsor set!');
          } else {
            console.log('⚠️ Sponsor not active or not popup size');
            setError('No active popup sponsor');
          }
        } else {
          console.log('❌ No sponsor returned from API');
          setError('No popup sponsor found');
        }
      } catch (error) {
        console.error('❌ Error fetching popup sponsor:', error);
        setError(error instanceof Error ? error.message : 'Unknown error');
      } finally {
        if (isMounted.current) {
          setLoading(false);
        }
      }
    };

    fetchPopupSponsor();

    return () => {
      isMounted.current = false;
    };
  }, []);

  // ============================================================
  // TRACK IMPRESSION
  // ============================================================

  const trackImpression = useCallback(async (sponsorId: number) => {
    try {
      await fetch('/api/public/sponsor/impression', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sponsorId, placement: 'popup' }),
      });
      console.log('📊 Impression tracked for sponsor:', sponsorId);
    } catch (error) {
      console.error('Error tracking impression:', error);
    }
  }, []);

  // ============================================================
  // TRACK CLICK
  // ============================================================

  const trackClick = useCallback(async (sponsorId: number) => {
    try {
      await fetch('/api/public/sponsor/click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sponsorId, placement: 'popup' }),
      });
      console.log('🖱️ Click tracked for sponsor:', sponsorId);
    } catch (error) {
      console.error('Error tracking click:', error);
    }
  }, []);

  // ============================================================
  // POPUP LOGIC - SHOW AFTER 5 SECONDS (TEST)
  // ============================================================

  useEffect(() => {
    // Only proceed if we have a valid popup sponsor
    if (!sponsor) {
      console.log('⏳ No sponsor yet, waiting...');
      return;
    }

    if (sponsor.size !== 'popup' || !sponsor.is_active) {
      console.log('⚠️ Sponsor not valid for popup');
      return;
    }

    if (!isMounted.current) return;

    // Clear any existing timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    // Check if popup was shown in last 24 hours
    const lastPopup = getCookie('popup_last_shown');
    if (lastPopup) {
      const lastShown = parseInt(lastPopup);
      const hoursSince = (Date.now() - lastShown) / (1000 * 60 * 60);
      if (hoursSince < 24) {
        console.log(`⏰ Popup shown ${Math.round(hoursSince)} hours ago, skipping (24h cooldown)`);
        return;
      }
    }

    // Check if popup was closed
    const popupClosed = getCookie('popup_closed');
    if (popupClosed === 'true') {
      console.log('❌ Popup was closed, skipping');
      return;
    }

    // Track impression
    if (!hasTrackedImpression.current) {
      hasTrackedImpression.current = true;
      trackImpression(sponsor.id);
    }

    console.log(`⏳ Popup will show in 5 seconds...`);

    // ✅ SIMPLE TIMER - Show popup after 5 seconds
    timerRef.current = setTimeout(() => {
      if (isMounted.current) {
        console.log('🎯 POPUP SHOWING NOW!');
        setIsVisible(true);
        setCookie('popup_last_shown', String(Date.now()));
      }
    }, 333000); // 5 seconds for testing

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [sponsor, trackImpression]);

  // ============================================================
  // RENDER
  // ============================================================

  // Loading state
  if (loading) {
    console.log('⏳ Loading popup...');
    return null;
  }

  // Error state - show nothing but log
  if (error || !sponsor) {
    console.log('❌ No popup to show:', error || 'No sponsor');
    return null;
  }

  // Check if valid
  if (!sponsor.is_active || sponsor.size !== 'popup') {
    console.log('⚠️ Sponsor not active or not popup size');
    return null;
  }

  // Not visible or closed
  if (!isVisible || isClosed) {
    return null;
  }

  console.log('✅ Rendering popup!');

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl">
        {/* Close Button - TOP RIGHT */}
        <button
          onClick={() => {
            console.log('❌ User closed popup');
            setIsClosed(true);
            setIsVisible(false);
            setCookie('popup_closed', 'true');
          }}
          className="absolute -top-3 -right-3 z-20 p-2 bg-black/70 hover:bg-black/90 text-white/80 hover:text-white transition-colors border border-white/10"
          aria-label="Close popup"
        >
          <X size={22} strokeWidth={1.5} />
        </button>

        {/* Popup Content */}
        <div 
          className="w-full"
          onClick={() => trackClick(sponsor.id)}
        >
          <div 
            className="w-full"
            dangerouslySetInnerHTML={{ __html: sponsor.code }}
          />
        </div>
      </div>
    </div>
  );
}