'use client';

import { ReactNode } from 'react';

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
  
  const handleClick = async (e: React.MouseEvent<HTMLAnchorElement>) => {
    // Allow the link to open naturally
    // Track click in background without blocking navigation
    
    try {
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