'use client';

import { ReactNode } from 'react';

interface OfferClickTrackerProps {
  offerLink: string;
  slug: string;
  className?: string;
  children: ReactNode;
}

export default function OfferClickTracker({ 
  offerLink, 
  slug, 
  className = '', 
  children 
}: OfferClickTrackerProps) {
  
  const handleClick = async (e: React.MouseEvent<HTMLAnchorElement>) => {
    // Allow the link to open naturally
    // Track click in background without blocking navigation
    
    try {
      await fetch('/api/public/offers/track-click', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ slug }),
      });
    } catch (error) {
      // Silent fail - don't block navigation
      console.error('Error tracking offer click:', error);
    }
  };

  return (
    <a
      href={offerLink}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      className={className}
    >
      {children}
    </a>
  );
}