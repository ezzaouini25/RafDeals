'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Category } from '@/types';

interface LayoutWrapperProps {
  children: React.ReactNode;
  offerCategories?: Category[];
  articleCategories?: Category[];
  dealCategories?: Category[];
  legalPages?: { slug: string; title?: string }[];
}

export default function LayoutWrapper({
  children,
  offerCategories = [],
  articleCategories = [],
  dealCategories = [],
  legalPages = [],
}: LayoutWrapperProps) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith('/admin') || false;

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-yellow focus:text-navy focus:px-4 focus:py-2 focus:rounded-btn focus:font-semibold min-h-[44px] flex items-center"
      >
        Skip to main content
      </a>

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

      {!isAdminRoute && (
        <Footer
          offerCategories={offerCategories}
          articleCategories={articleCategories}
          dealCategories={dealCategories}
          legalPages={legalPages}
        />
      )}
    </>
  );
}