'use client';

import { ReactNode, useState } from 'react';

interface DealClickTrackerProps {
  dealLink: string;
  slug: string;
  className?: string;
  children: ReactNode;
}

export default function DealClickTracker({ 
  dealLink, 
  slug, 
  className = '', 
  children 
}: DealClickTrackerProps) {
  // ✅ Prevent double tracking
  const [isTracking, setIsTracking] = useState(false);

  const handleClick = async (e: React.MouseEvent<HTMLAnchorElement>) => {
    // ✅ 1. Stop the default link behavior
    e.preventDefault();

    // ✅ 2. If already tracking, ignore
    if (isTracking) return;
    setIsTracking(true);

    try {
      // ✅ 3. Track the click in the database
      await fetch('/api/public/deals/track-click', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ slug }),
      });
    } catch (error) {
      // Silent fail - don't block navigation
      console.error('Error tracking deal click:', error);
    }

    // ✅ 4. Open the link manually AFTER tracking
    window.open(dealLink, '_blank', 'noopener,noreferrer');

    // ✅ 5. Reset tracking state after 1 second
    setTimeout(() => setIsTracking(false), 1000);
  };

  return (
    <a
      href={dealLink}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      className={className}
    >
      {children}
    </a>
  );
}