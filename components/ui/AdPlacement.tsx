'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

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

interface AdPlacementProps {
  placement: 'home' | 'blog' | 'offers' | 'article-content' | 'offer-content' | 'sidebar' | 'contact';
  className?: string;
}

// ============================================================
// SVG ICONS
// ============================================================

function StarIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} width="7" height="7" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

function CircleIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} width="5" height="5" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="12" r="10" />
    </svg>
  );
}

// ============================================================
// DEVICE DETECTION
// ============================================================

function useDeviceDetect() {
  const [device, setDevice] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');

  useEffect(() => {
    const checkDevice = () => {
      const width = window.innerWidth;
      if (width < 640) setDevice('mobile');
      else if (width >= 640 && width < 1024) setDevice('tablet');
      else setDevice('desktop');
    };
    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  return device;
}

// ============================================================
// VIEWPORT WIDTH
// ============================================================

function useViewportWidth() {
  const [width, setWidth] = useState(1200);
  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  return width;
}

// ============================================================
// EXACT SIZE MAPPING
// ============================================================

function getExactSize(placement: string, device: 'mobile' | 'tablet' | 'desktop'): string | null {
  const sizeMap: Record<string, Record<'mobile' | 'tablet' | 'desktop', string>> = {
    'home': { mobile: '300x250', tablet: '728x90', desktop: '970x250' },
    'blog': { mobile: '320x100', tablet: '728x90', desktop: '970x90' },
    'offers': { mobile: '320x100', tablet: '728x90', desktop: '970x90' },
    'article-content': { mobile: '320x100', tablet: '728x90', desktop: '970x90' },
    'offer-content': { mobile: '320x100', tablet: '728x90', desktop: '970x90' },
    'sidebar': { mobile: '200x300', tablet: '240x400', desktop: '350x600' },
  };
  return sizeMap[placement]?.[device] || null;
}

// ============================================================
// GET DISPLAY DURATION
// ============================================================

function getDisplayDuration(isBoosted: boolean): number {
  return isBoosted ? 60000 : 10000;
}

// ============================================================
// FETCH WITH TIMEOUT (ignores AbortError)
// ============================================================

async function fetchWithTimeout(url: string, options: RequestInit & { timeout?: number } = {}) {
  const { timeout = 5000, ...fetchOptions } = options;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, { ...fetchOptions, signal: controller.signal });
    clearTimeout(id);
    return response;
  } catch (error: any) {
    clearTimeout(id);
    // Ignore the AbortError if the component unmounted (Strict Mode)
    if (error.name === 'AbortError') {
      return null;
    }
    throw error;
  }
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function AdPlacement({ placement, className = '' }: AdPlacementProps) {
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [currentSponsor, setCurrentSponsor] = useState<Sponsor | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  const device = useDeviceDetect();
  const viewportWidth = useViewportWidth();
  const hasTrackedImpression = useRef(false);
  const isMounted = useRef(true);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const exactSize = getExactSize(placement, device);
  const [exactW, exactH] = exactSize ? exactSize.split('x').map(Number) : [0, 0];
  const displayWidth = exactW > 0 ? Math.min(exactW, viewportWidth - 32) : 0;
  const displayHeight = exactH;

  // ============================================================
  // FETCH SPONSORS
  // ============================================================

  useEffect(() => {
    isMounted.current = true;
    setLoading(true);
    hasTrackedImpression.current = false;

    const fetchSponsors = async () => {
      if (!exactSize) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetchWithTimeout(
          `/api/public/sponsor?placement=${placement}&size=${exactSize}&all=true`,
          { cache: 'no-store', timeout: 5000 }
        );

        if (!res || !res.ok) throw new Error(`HTTP ${res?.status || 'Aborted'}`);

        const data = await res.json();

        if (!isMounted.current) return;

        if (data.sponsors && Array.isArray(data.sponsors) && data.sponsors.length > 0) {
          // Robust filter: accepts boolean true, number 1, string "1", string "true"
          const active = data.sponsors.filter((s: Sponsor) => {
            const val = s.is_active;
            return (val as any) === true || (val as any) === 1 || (val as any) === '1' || (val as any) === 'true';
          });

          const sorted = active.sort((a: Sponsor, b: Sponsor) => {
            if (a.is_boosted && !b.is_boosted) return -1;
            if (!a.is_boosted && b.is_boosted) return 1;
            return a.impressions - b.impressions;
          });

          if (sorted.length > 0 && isMounted.current) {
            setSponsors(sorted);
            setCurrentSponsor(sorted[0]);
            if (!hasTrackedImpression.current) {
              hasTrackedImpression.current = true;
              trackImpression(sorted[0].id);
            }
          }
        }
      } catch (err: any) {
        // Silently ignore errors caused by unmounting
        if (err.name !== 'AbortError' && err.message !== 'HTTP Aborted') {
          console.error('Ad fetch error:', err);
        }
      } finally {
        if (isMounted.current) setLoading(false);
      }
    };

    fetchSponsors();

    return () => {
      isMounted.current = false;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [placement, exactSize]);

  // ============================================================
  // ROTATION
  // ============================================================

  useEffect(() => {
    if (sponsors.length <= 1 || !currentSponsor) return;
    if (timerRef.current) clearTimeout(timerRef.current);

    const duration = getDisplayDuration(currentSponsor.is_boosted);

    timerRef.current = setTimeout(() => {
      if (!isMounted.current) return;
      const nextIndex = (currentIndex + 1) % sponsors.length;
      setCurrentIndex(nextIndex);
      setCurrentSponsor(sponsors[nextIndex]);
      trackImpression(sponsors[nextIndex].id);
    }, duration);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [currentSponsor, currentIndex, sponsors]);

  // ============================================================
  // TRACKERS
  // ============================================================

  const trackImpression = useCallback(async (sponsorId: number) => {
    try {
      await fetch('/api/public/sponsor/impression', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sponsorId, placement }),
      });
    } catch (e) {
      console.error(e);
    }
  }, [placement]);

  const trackClick = useCallback(async (sponsorId: number) => {
    try {
      await fetch('/api/public/sponsor/click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sponsorId, placement }),
      });
    } catch (e) {
      console.error(e);
    }
  }, [placement]);

  // ============================================================
  // RENDER: SMALL OVERLAY HEADER
  // ============================================================

  const OverlayHeader = ({ sponsor }: { sponsor?: Sponsor }) => (
    <div className="absolute top-0 left-0 z-10 inline-flex items-center gap-1.5 px-2 py-[4px] bg-black/30 backdrop-blur-sm pointer-events-none select-none">
      <span className="text-[8px] font-medium uppercase tracking-wider text-white/90 leading-none">
        Sponsored
      </span>

      {sponsor?.is_boosted ? (
        <span className="inline-flex items-center gap-0.5 text-[7px] font-bold uppercase tracking-wider text-yellow leading-none">
          <StarIcon />
          Featured
        </span>
      ) : (
        <span className="inline-flex items-center gap-1 text-[7px] font-medium uppercase tracking-wider text-emerald-400 leading-none">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
          </span>
          Ad
        </span>
      )}

      {sponsor?.name && (
        <span className="text-[7px] font-medium text-white/50 truncate max-w-[100px] leading-none">
          {sponsor.name}
        </span>
      )}
    </div>
  );

  // ============================================================
  // RENDER: ROTATION INDICATOR
  // ============================================================

  const RotationIndicator = () => {
    if (sponsors.length <= 1 || !currentSponsor) return null;
    return (
      <div className="absolute bottom-1.5 right-1.5 z-10 inline-flex items-center gap-1 bg-black/50 backdrop-blur-sm px-1.5 py-[2px] rounded pointer-events-none select-none">
        <span className="text-[7px] font-medium text-white/70 leading-none">
          {currentIndex + 1}/{sponsors.length}
        </span>
        {currentSponsor.is_boosted ? (
          <StarIcon className="text-yellow" />
        ) : (
          <CircleIcon className="text-white/40" />
        )}
      </div>
    );
  };

  // ============================================================
  // DIMENSIONS
  // ============================================================

  const dims = { width: displayWidth || 300, height: displayHeight || 250 };

  // ============================================================
  // ✅ LOADING → RENDER NOTHING
  // No skeleton, no placeholder box — the section stays invisible.
  // ============================================================
  if (loading) {
    return null;
  }

  // ============================================================
  // ✅ NO SPONSORS / API ERROR → RENDER NOTHING
  // No "No ads" placeholder — the section disappears entirely.
  // ============================================================
  if (!currentSponsor || sponsors.length === 0) {
    return null;
  }

  // ============================================================
  // RENDER AD
  // ============================================================

  return (
    <div className={`flex justify-center ${className}`}>
      <div
        className="relative border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950 overflow-hidden cursor-pointer"
        style={{ width: dims.width, height: dims.height }}
        onClick={() => trackClick(currentSponsor.id)}
      >
        <OverlayHeader sponsor={currentSponsor} />
        <RotationIndicator />

        <div
          className="w-full h-full"
          dangerouslySetInnerHTML={{ __html: currentSponsor.code }}
        />
      </div>
    </div>
  );
}