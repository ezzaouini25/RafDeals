'use client';

import { useState, useEffect } from 'react';

interface Ad {
  id: number;
  name: string;
  ad_data: string;
  size: string;
  is_active: number;
}

interface GoogleAdSenseProps {
  placement: 'home' | 'sidebar' | 'in_content_top' | 'in_content_middle' | 'in_content_bottom' | 'article_top' | 'article_bottom' | 'offer_top' | 'offer_bottom';
  className?: string;
}

// ============================================================
// AD SIZES BY PLACEMENT & DEVICE
// ============================================================

const AD_SIZES = {
  home: { mobile: '320x100', tablet: '728x90', desktop: '970x250' },
  sidebar: { mobile: '300x250', tablet: '336x280', desktop: '300x600' },
  in_content_top: { mobile: '336x280', tablet: '336x280', desktop: '970x250' },
  in_content_middle: { mobile: '336x280', tablet: '336x280', desktop: '970x250' },
  in_content_bottom: { mobile: '336x280', tablet: '336x280', desktop: '970x250' },
  article_top: { mobile: '320x50', tablet: '320x100', desktop: '728x90' },
  article_bottom: { mobile: '320x50', tablet: '320x100', desktop: '728x90' },
  offer_top: { mobile: '320x50', tablet: '320x100', desktop: '728x90' },
  offer_bottom: { mobile: '320x50', tablet: '320x100', desktop: '728x90' },
};

// ============================================================
// DEVICE DETECTION
// ============================================================

const getDevice = (): 'mobile' | 'tablet' | 'desktop' => {
  if (typeof window === 'undefined') return 'desktop';
  const width = window.innerWidth;
  if (width < 768) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
};

// ============================================================
// VIEWPORT WIDTH
// ============================================================

const useViewportWidth = () => {
  const [width, setWidth] = useState(1200);
  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  return width;
};

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function GoogleAdSense({
  placement,
  className = ''
}: GoogleAdSenseProps) {
  const [ad, setAd] = useState<Ad | null>(null);
  const [loading, setLoading] = useState(true);
  const [size, setSize] = useState<string>('');
  const [dimensions, setDimensions] = useState({ width: 300, height: 250 });

  const viewportWidth = useViewportWidth();

  // Detect device and get exact size
  useEffect(() => {
    const device = getDevice();
    const config = AD_SIZES[placement];
    if (config) {
      const exactSize = config[device];
      setSize(exactSize);

      const [exactW, exactH] = exactSize.split('x').map(Number);
      const displayWidth = exactW > 0 ? Math.min(exactW, viewportWidth - 32) : 300;
      setDimensions({ width: displayWidth, height: exactH || 250 });

      console.log('📱 Device:', device, 'Size:', exactSize, 'Placement:', placement);
    }
  }, [placement, viewportWidth]);

  // Fetch ad for exact size only
  useEffect(() => {
    if (!size) return;

    const fetchAd = async () => {
      try {
        setLoading(true);
        console.log('🔍 Fetching ad for size:', size);

        // ✅ Removed `&_=${Date.now()}` cache-buster and `cache: 'no-store'`
        // so the browser/CDN can reuse Vercel's `revalidate = 600` cached response.
        const url = `/api/public/advertisements?size=${size}`;
        const res = await fetch(url);

        const data = await res.json();
        console.log('📦 API Response:', data);

        if (data.success && data.ad) {
          console.log('✅ Ad found:', data.ad.name);
          setAd(data.ad);
        } else {
          console.log('❌ No ad found for size:', size);
          setAd(null);
        }
      } catch (err) {
        console.error('❌ Error:', err);
        setAd(null);
      } finally {
        setLoading(false);
      }
    };

    fetchAd();
  }, [size]);

  // ============================================================
  // ✅ LOADING → RENDER NOTHING
  // ============================================================
  if (loading) {
    return null;
  }

  // ============================================================
  // ✅ NO AD → RENDER NOTHING
  // ============================================================
  if (!ad) {
    return null;
  }

  // ============================================================
  // RENDER AD (EXACT DIMENSIONS)
  // ============================================================

  return (
    <div className={`flex justify-center ${className}`}>
      <div
        className="relative border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950 overflow-hidden"
        style={{ width: dimensions.width, height: dimensions.height }}
      >
        {/* OVERLAY HEADER */}
        <div className="absolute top-0 left-0 z-10 inline-flex items-center gap-1.5 px-2 py-[4px] bg-black/30 backdrop-blur-sm pointer-events-none select-none">
          <span className="text-[8px] font-medium uppercase tracking-wider text-white/90 leading-none">
            Advertisements
          </span>
          <span className="inline-flex items-center gap-1 text-[7px] font-medium uppercase tracking-wider text-emerald-400 leading-none">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
            </span>
            Ad
          </span>
        </div>

        {/* AD CONTENT */}
        <div
          className="w-full h-full flex items-center justify-center"
          dangerouslySetInnerHTML={{ __html: ad.ad_data }}
        />
      </div>
    </div>
  );
}