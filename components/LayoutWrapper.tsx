'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import CookieConsent from '@/components/ui/CookieConsent';
import PageLoader from '@/components/ui/PageLoader';
import { Category } from '@/types';

interface LayoutWrapperProps {
  children: React.ReactNode;
  offerCategories?: Category[];
  articleCategories?: Category[];
  dealCategories?: Category[];
}

export default function LayoutWrapper({ 
  children, 
  offerCategories = [], 
  articleCategories = [],
  dealCategories = []
}: LayoutWrapperProps) {
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);
  
  // ✅ Check if we're on admin routes
  const isAdminRoute = pathname?.startsWith('/admin') || false;

  useEffect(() => {
    // Hide loader after initial mount
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1200);

    return () => clearTimeout(timer);
  }, []);

  // Show global page loader on initial load (skip on admin if preferred)
  if (isLoading && !isAdminRoute) {
    return <PageLoader message="Loading amazing opportunities..." minHeight="min-h-screen" />;
  }

  return (
    <>
      <a 
        href="#main" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-yellow focus:text-navy focus:px-4 focus:py-2 focus:rounded-btn focus:font-semibold min-h-[44px] flex items-center"
      >
        Skip to main content
      </a>
      
      {/* ✅ Only show on NON-admin routes */}
      {!isAdminRoute && (
        <Header 
          offerCategories={offerCategories}
          articleCategories={articleCategories}
          dealCategories={dealCategories}
        />
      )}
      
      <main id="main" className="min-h-[70vh]">
        {children}
      </main>
      
      {/* ✅ Only show on NON-admin routes */}
      {!isAdminRoute && <Footer />}
      {!isAdminRoute && <CookieConsent />}
    </>
  );
}