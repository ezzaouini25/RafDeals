'use client';

import Link from 'next/link';
import Image from 'next/image';
import NewsletterSubscribe from '@/components/ui/NewsletterSubscribe';
import { useState, useEffect } from 'react';

// ---------------------------------------------------------------------------
// 1. PAGES ARRAY
// ---------------------------------------------------------------------------
const pages = [
  { href: '/', label: 'Home' },
  { href: '/blog', label: 'Blog' },
  { href: '/offers', label: 'Offers' },
  { href: '/deals', label: 'Deals' },
  { href: '/contact', label: 'Contact' },
];

// ---------------------------------------------------------------------------
// 2. OFFERS CATEGORIES ARRAY
// ---------------------------------------------------------------------------
const offersCategories = [
  { href: '/offers/finance', label: 'Finance & Banking' },
  { href: '/offers/cashback', label: 'Cashback Rewards' },
  { href: '/offers/crypto', label: 'Crypto Bonuses' },
  { href: '/offers/gift-cards', label: 'Gift Cards' },
  { href: '/offers/sign-up', label: 'Sign-Up Bonuses' },
];

// ---------------------------------------------------------------------------
// 3. DEALS CATEGORIES ARRAY
// ---------------------------------------------------------------------------
const dealsCategories = [
  { href: '/deals/electronics', label: 'Electronics & Tech' },
  { href: '/deals/software', label: 'Software & Subscriptions' },
  { href: '/deals/home', label: 'Home & Lifestyle' },
  { href: '/deals/travel', label: 'Travel & Leisure' },
  { href: '/deals/fashion', label: 'Fashion & Apparel' },
];

// ---------------------------------------------------------------------------
// 4. LEGAL PAGES ARRAY
// ---------------------------------------------------------------------------
const defaultLegalPages = [
  { slug: 'privacy-policy', title: 'Privacy Policy' },
  { slug: 'terms-of-service', title: 'Terms of Service' },
  { slug: 'disclaimer', title: 'Disclaimer' },
  { slug: 'cookie-policy', title: 'Cookie Policy' },
];

const getLegalLabel = (slug: string): string => {
  return slug
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (l) => l.toUpperCase());
};

export default function Footer({ legalPages: legalPagesProp }: { legalPages?: { slug: string }[] } = {}) {
  const [legalPages, setLegalPages] = useState<{ slug: string; title?: string }[]>(
    legalPagesProp && legalPagesProp.length > 0 ? legalPagesProp : defaultLegalPages
  );

  useEffect(() => {
    const fetchLegalPages = async () => {
      try {
        const res = await fetch('/api/public/legal-pages');
        if (res.ok) {
          const data = await res.json();
          if (data && data.length > 0) {
            setLegalPages(data);
          }
        }
      } catch (error) {
        console.error('Error fetching legal pages:', error);
      }
    };
    fetchLegalPages();
  }, []);

  return (
    <footer className="bg-navy text-white border-t border-navy/50">
      <div className="max-w-container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        
        {/* Main Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-10">
          
          {/* Brand & Logo Column (Spans 2 cols) */}
          <div className="lg:col-span-2">
            <Link href="/" className="inline-block mb-4 group">
              <div className="h-10 flex items-center">
                <Image
                  src="/img/banner.png"
                  alt="RafDeals Logo"
                  width={180}
                  height={40}
                  className="object-contain h-full w-auto transition-transform group-hover:scale-105"
                  priority
                />
              </div>
            </Link>
            <p className="mt-4 text-sm text-gray-300 leading-relaxed max-w-sm">
              RafDeals is your ultimate compass for financial empowerment and exclusive savings. We meticulously curate verified offers and high-value deals to ensure you never miss a genuine opportunity. Stop searching, start saving, and maximize your returns with confidence.
            </p>
          </div>

          {/* Pages */}
          <div>
            <h4 className="font-semibold text-white mb-4 tracking-wide uppercase text-xs">Pages</h4>
            <ul className="space-y-2">
              {pages.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-sm text-gray-300 hover:text-yellow transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Offers Categories */}
          <div>
            <h4 className="font-semibold text-white mb-4 tracking-wide uppercase text-xs">Offers</h4>
            <ul className="space-y-2">
              {offersCategories.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-sm text-gray-300 hover:text-yellow transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Deals Categories */}
          <div>
            <h4 className="font-semibold text-white mb-4 tracking-wide uppercase text-xs">Deals</h4>
            <ul className="space-y-2">
              {dealsCategories.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-sm text-gray-300 hover:text-yellow transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Pages */}
          <div>
            <h4 className="font-semibold text-white mb-4 tracking-wide uppercase text-xs">Legal</h4>
            <ul className="space-y-2">
              {legalPages.map((page) => (
                <li key={page.slug}>
                  <Link 
                    href={`/legal/${page.slug}`} 
                    className="text-sm text-gray-300 hover:text-yellow transition-colors"
                  >
                    {page.title || getLegalLabel(page.slug)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

        </div> {/* ✅ CLOSED GRID HERE */}

        {/* Full-Width Newsletter Area */}
        <div className="w-full border-t border-white/10 pt-10 pb-6 mt-12">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="max-w-lg">
              <h4 className="font-semibold text-white mb-2 tracking-wide uppercase text-sm">
                Join the RafDeals Newsletter
              </h4>
              <p className="text-sm text-gray-300 leading-relaxed">
                Get the latest exclusive offers and verified deal alerts delivered straight to your inbox. No spam, just real savings.
              </p>
            </div>
            
            <div className="w-full md:w-auto md:min-w-[400px]">
              <NewsletterSubscribe />
            </div>
          </div>
        </div>

      </div> {/* ✅ CLOSED CONTAINER HERE */}

      {/* Bottom Bar */}
      <div className="border-t border-white/10 bg-black/20">
        <div className="max-w-container mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-center">
          <p className="text-sm text-gray-400 text-center">
            &copy; {new Date().getFullYear()} All rights reserved. RafDeals.com
          </p>
        </div>
      </div>
    </footer>
  );
}