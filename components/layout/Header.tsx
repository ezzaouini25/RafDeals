'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Menu, X, Search, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import SearchPopup from '@/components/ui/SearchPopup';
import { Category } from '@/types';

interface HeaderProps {
  offerCategories?: Category[];
  articleCategories?: Category[];
  dealCategories?: Category[];
}

export default function Header({
  offerCategories = [],
  articleCategories = [],
  dealCategories = [],
}: HeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const [activeDropdown, setActiveDropdown] = useState<'offers' | 'deals' | 'blog' | null>(null);

  const [mobileOffersOpen, setMobileOffersOpen] = useState(false);
  const [mobileDealsOpen, setMobileDealsOpen] = useState(false);
  const [mobileBlogOpen, setMobileBlogOpen] = useState(false);

  const pathname = usePathname();

  const offersDropdownRef = useRef<HTMLDivElement>(null);
  const dealsDropdownRef = useRef<HTMLDivElement>(null);
  const blogDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (offersDropdownRef.current && !offersDropdownRef.current.contains(event.target as Node)) {
        setActiveDropdown((prev) => (prev === 'offers' ? null : prev));
      }
      if (dealsDropdownRef.current && !dealsDropdownRef.current.contains(event.target as Node)) {
        setActiveDropdown((prev) => (prev === 'deals' ? null : prev));
      }
      if (blogDropdownRef.current && !blogDropdownRef.current.contains(event.target as Node)) {
        setActiveDropdown((prev) => (prev === 'blog' ? null : prev));
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setActiveDropdown(null);
    setMobileOffersOpen(false);
    setMobileDealsOpen(false);
    setMobileBlogOpen(false);
  }, [pathname]);

  const hasOfferCategories = offerCategories && offerCategories.length > 0;
  const hasArticleCategories = articleCategories && articleCategories.length > 0;
  const hasDealCategories = dealCategories && dealCategories.length > 0;

  const navBtnBase =
    'relative text-sm lg:text-base font-semibold transition-colors duration-200 px-3 lg:px-5 py-3 flex items-center justify-center gap-1 lg:gap-1.5';
  const navActive = 'bg-yellow text-navy';
  const navIdle = 'text-gray-300 hover:bg-yellow hover:text-navy';

  return (
    <header className="sticky top-0 z-50 bg-navy text-white border-b border-white/15">
      <div className="bg-black/20 w-full">
        <div className="max-w-container mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16 md:h-20">

          {/* LOGO */}
          <Link
            href="/"
            className="flex items-center hover:opacity-90 transition-opacity shrink-0"
          >
            <Image
              src="/img/banner.png"
              alt="RAFDeals"
              width={180}
              height={50}
              priority
              className="h-8 md:h-10 w-auto object-contain"
            />
          </Link>

          {/* DESKTOP NAVIGATION - Hidden below lg (1024px) */}
          <nav className="hidden lg:flex items-center gap-1 lg:gap-2">
            <Link
              href="/"
              className={cn(navBtnBase, pathname === '/' ? navActive : navIdle)}
            >
              Home
            </Link>

            {/* OFFERS DROPDOWN */}
            <div className="relative" ref={offersDropdownRef}>
              <button
                onClick={() => setActiveDropdown(activeDropdown === 'offers' ? null : 'offers')}
                onMouseEnter={() => setActiveDropdown('offers')}
                className={cn(
                  navBtnBase,
                  (pathname?.startsWith('/offers') || activeDropdown === 'offers') ? navActive : navIdle
                )}
              >
                Offers
                <ChevronDown size={16} className={cn(
                  'transition-transform duration-200',
                  activeDropdown === 'offers' ? 'rotate-180' : ''
                )} />
              </button>

              {activeDropdown === 'offers' && (
                <>
                  <div className="absolute left-0 right-0 top-full h-2 z-40" />
                  <div
                    className="absolute top-full left-0 mt-2 min-w-[240px] bg-navy border border-white/10 shadow-xl z-50 animate-fadeIn"
                    onMouseEnter={() => setActiveDropdown('offers')}
                    onMouseLeave={() => setActiveDropdown(null)}
                  >
                    <Link href="/offers" onClick={() => setActiveDropdown(null)} className="block px-5 py-3.5 text-base font-semibold text-white bg-navy hover:bg-yellow hover:text-navy transition-colors border-b border-white/10">
                      All Offers
                    </Link>
                    {hasOfferCategories && offerCategories.map((category) => (
                      <Link key={category.id} href={`/offers/category/${category.slug}`} onClick={() => setActiveDropdown(null)} className="block px-5 py-3.5 text-base font-semibold text-white bg-navy hover:bg-yellow hover:text-navy transition-colors border-b border-white/10 last:border-b-0">
                        {category.name}
                      </Link>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* DEALS DROPDOWN */}
            <div className="relative" ref={dealsDropdownRef}>
              <button
                onClick={() => setActiveDropdown(activeDropdown === 'deals' ? null : 'deals')}
                onMouseEnter={() => setActiveDropdown('deals')}
                className={cn(
                  navBtnBase,
                  (pathname?.startsWith('/deals') || activeDropdown === 'deals') ? navActive : navIdle
                )}
              >
                Deals
                <ChevronDown size={16} className={cn(
                  'transition-transform duration-200',
                  activeDropdown === 'deals' ? 'rotate-180' : ''
                )} />
              </button>

              {activeDropdown === 'deals' && (
                <>
                  <div className="absolute left-0 right-0 top-full h-2 z-40" />
                  <div
                    className="absolute top-full left-0 mt-2 min-w-[240px] bg-navy border border-white/10 shadow-xl z-50 animate-fadeIn"
                    onMouseEnter={() => setActiveDropdown('deals')}
                    onMouseLeave={() => setActiveDropdown(null)}
                  >
                    <Link href="/deals" onClick={() => setActiveDropdown(null)} className="block px-5 py-3.5 text-base font-semibold text-white bg-navy hover:bg-yellow hover:text-navy transition-colors border-b border-white/10">
                      All Deals
                    </Link>
                    {hasDealCategories && dealCategories.map((category) => (
                      <Link key={category.id} href={`/deals/category/${category.slug}`} onClick={() => setActiveDropdown(null)} className="block px-5 py-3.5 text-base font-semibold text-white bg-navy hover:bg-yellow hover:text-navy transition-colors border-b border-white/10 last:border-b-0">
                        {category.name}
                      </Link>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* BLOG DROPDOWN */}
            <div className="relative" ref={blogDropdownRef}>
              <button
                onClick={() => setActiveDropdown(activeDropdown === 'blog' ? null : 'blog')}
                onMouseEnter={() => setActiveDropdown('blog')}
                className={cn(
                  navBtnBase,
                  (pathname?.startsWith('/blog') || activeDropdown === 'blog') ? navActive : navIdle
                )}
              >
                Blog
                <ChevronDown size={16} className={cn(
                  'transition-transform duration-200',
                  activeDropdown === 'blog' ? 'rotate-180' : ''
                )} />
              </button>

              {activeDropdown === 'blog' && (
                <>
                  <div className="absolute left-0 right-0 top-full h-2 z-40" />
                  <div
                    className="absolute top-full left-0 mt-2 min-w-[240px] bg-navy border border-white/10 shadow-xl z-50 animate-fadeIn"
                    onMouseEnter={() => setActiveDropdown('blog')}
                    onMouseLeave={() => setActiveDropdown(null)}
                  >
                    <Link href="/blog" onClick={() => setActiveDropdown(null)} className="block px-5 py-3.5 text-base font-semibold text-white bg-navy hover:bg-yellow hover:text-navy transition-colors border-b border-white/10">
                      All Articles
                    </Link>
                    {hasArticleCategories && articleCategories.map((category) => (
                      <Link key={category.id} href={`/blog/category/${category.slug}`} onClick={() => setActiveDropdown(null)} className="block px-5 py-3.5 text-base font-semibold text-white bg-navy hover:bg-yellow hover:text-navy transition-colors border-b border-white/10 last:border-b-0">
                        {category.name}
                      </Link>
                    ))}
                  </div>
                </>
              )}
            </div>

            <Link href="/contact" className={cn(navBtnBase, pathname === '/contact' ? navActive : navIdle)}>
              Contact
            </Link>
          </nav>

          {/* DESKTOP RIGHT (Search & Get Started) - Hidden below lg */}
          <div className="hidden lg:flex items-center gap-3 shrink-0">
            <button
              onClick={() => setSearchOpen(true)}
              className="p-2.5 text-gray-300 hover:bg-yellow hover:text-navy transition-colors flex items-center justify-center cursor-pointer min-h-[44px] min-w-[44px]"
              aria-label="Open Search"
            >
              <Search size={20} />
            </button>

            <Link
              href="/offers"
              className="inline-flex items-center gap-2 px-5 py-3 bg-yellow text-navy text-base font-bold hover:bg-yellow-hover transition-all duration-200 shadow-lg shadow-yellow/20 hover:shadow-yellow/40 border border-yellow"
            >
              Get Started
            </Link>
          </div>

          {/* MOBILE & TABLET ACTIONS (Search & Hamburger) - Hidden on lg+ */}
          <div className="flex lg:hidden items-center gap-2">
            <button
              onClick={() => setSearchOpen(true)}
              className="p-2 text-gray-300 hover:text-yellow transition-colors flex items-center justify-center min-w-10 min-h-10"
              aria-label="Open Search"
            >
              <Search size={20} />
            </button>

            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="p-2 text-white hover:text-yellow transition-colors flex items-center justify-center min-w-10 min-h-10"
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* MOBILE / TABLET DRAWER */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-navy text-white flex flex-col">
          <div className="flex justify-between items-center h-16 px-4 bg-black/20 border-b border-white/10 shrink-0">
            <Link href="/" onClick={() => setMobileOpen(false)} className="flex items-center">
              <Image src="/img/banner.png" alt="RAFDeals" width={160} height={44} priority className="h-8 w-auto object-contain" />
            </Link>
            <button onClick={() => setMobileOpen(false)} className="p-2 text-white hover:text-yellow transition-colors flex items-center justify-center min-w-10 min-h-10" aria-label="Close menu">
              <X size={24} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto w-full">
            <nav className="flex flex-col w-full divide-y divide-white/10 border-t border-b border-white/10">
              <Link href="/" onClick={() => setMobileOpen(false)} className={cn('w-full py-4 px-6 text-center text-base font-semibold transition-colors', pathname === '/' ? 'bg-yellow text-navy' : 'text-white hover:bg-yellow hover:text-navy')}>
                Home
              </Link>

              <div>
                <button onClick={() => setMobileOffersOpen(!mobileOffersOpen)} className={cn('w-full py-4 px-6 flex items-center justify-center gap-2 text-center text-base font-semibold transition-colors', pathname?.startsWith('/offers') ? 'bg-yellow text-navy' : 'text-white hover:bg-yellow hover:text-navy')}>
                  <span>Offers</span>
                  <ChevronDown size={18} className={cn('transition-transform duration-200 shrink-0', mobileOffersOpen ? 'rotate-180' : '')} />
                </button>
                {mobileOffersOpen && (
                  <div className="flex flex-col bg-black/20 border-t border-white/10">
                    <Link href="/offers" onClick={() => setMobileOpen(false)} className="w-full py-3 px-6 text-center text-sm font-medium text-white/80 hover:bg-yellow hover:text-navy transition-colors">All Offers</Link>
                    {hasOfferCategories && offerCategories.map((category) => (
                      <Link key={category.id} href={`/offers/category/${category.slug}`} onClick={() => setMobileOpen(false)} className="w-full py-3 px-6 text-center text-sm font-medium text-white/80 hover:bg-yellow hover:text-navy transition-colors">{category.name}</Link>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <button onClick={() => setMobileDealsOpen(!mobileDealsOpen)} className={cn('w-full py-4 px-6 flex items-center justify-center gap-2 text-center text-base font-semibold transition-colors', pathname?.startsWith('/deals') ? 'bg-yellow text-navy' : 'text-white hover:bg-yellow hover:text-navy')}>
                  <span>Deals</span>
                  <ChevronDown size={18} className={cn('transition-transform duration-200 shrink-0', mobileDealsOpen ? 'rotate-180' : '')} />
                </button>
                {mobileDealsOpen && (
                  <div className="flex flex-col bg-black/20 border-t border-white/10">
                    <Link href="/deals" onClick={() => setMobileOpen(false)} className="w-full py-3 px-6 text-center text-sm font-medium text-white/80 hover:bg-yellow hover:text-navy transition-colors">All Deals</Link>
                    {hasDealCategories && dealCategories.map((category) => (
                      <Link key={category.id} href={`/deals/category/${category.slug}`} onClick={() => setMobileOpen(false)} className="w-full py-3 px-6 text-center text-sm font-medium text-white/80 hover:bg-yellow hover:text-navy transition-colors">{category.name}</Link>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <button onClick={() => setMobileBlogOpen(!mobileBlogOpen)} className={cn('w-full py-4 px-6 flex items-center justify-center gap-2 text-center text-base font-semibold transition-colors', pathname?.startsWith('/blog') ? 'bg-yellow text-navy' : 'text-white hover:bg-yellow hover:text-navy')}>
                  <span>Blog</span>
                  <ChevronDown size={18} className={cn('transition-transform duration-200 shrink-0', mobileBlogOpen ? 'rotate-180' : '')} />
                </button>
                {mobileBlogOpen && (
                  <div className="flex flex-col bg-black/20 border-t border-white/10">
                    <Link href="/blog" onClick={() => setMobileOpen(false)} className="w-full py-3 px-6 text-center text-sm font-medium text-white/80 hover:bg-yellow hover:text-navy transition-colors">All Articles</Link>
                    {hasArticleCategories && articleCategories.map((category) => (
                      <Link key={category.id} href={`/blog/category/${category.slug}`} onClick={() => setMobileOpen(false)} className="w-full py-3 px-6 text-center text-sm font-medium text-white/80 hover:bg-yellow hover:text-navy transition-colors">{category.name}</Link>
                    ))}
                  </div>
                )}
              </div>

              <Link href="/contact" onClick={() => setMobileOpen(false)} className={cn('w-full py-4 px-6 text-center text-base font-semibold transition-colors', pathname === '/contact' ? 'bg-yellow text-navy' : 'text-white hover:bg-yellow hover:text-navy')}>
                Contact
              </Link>
            </nav>
          </div>

          <div className="shrink-0 border-t border-white/10 bg-navy">
            <button onClick={() => { setMobileOpen(false); setSearchOpen(true); }} className="flex w-full items-center justify-center gap-2 py-4 px-4 bg-navy text-white hover:bg-yellow hover:text-navy transition-colors border-b border-white/10">
              <span className="text-base font-semibold">Search</span>
              <Search size={18} />
            </button>
            <Link href="/offers" onClick={() => setMobileOpen(false)} className="block w-full text-center text-base font-bold py-4 px-4 bg-yellow text-navy hover:bg-yellow-hover transition-colors">
              Get Started →
            </Link>
          </div>
        </div>
      )}

      <SearchPopup isOpen={searchOpen} onClose={() => setSearchOpen(false)} />

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-8px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out forwards;
        }
      `}</style>
    </header>
  );
}