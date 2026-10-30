'use client';

import Link from 'next/link';
import Image from 'next/image';
import NewsletterSubscribe from '@/components/ui/NewsletterSubscribe';
import { Category } from '@/types';

interface FooterProps {
  offerCategories?: Category[];
  articleCategories?: Category[];
  dealCategories?: Category[];
  legalPages?: { slug: string; title?: string }[];
}

const pages = [
  { href: '/', label: 'Home' },
  { href: '/blog', label: 'Blog' },
  { href: '/offers', label: 'Offers' },
  { href: '/deals', label: 'Deals' },
  { href: '/contact', label: 'Contact' },
];

const getLegalLabel = (slug: string): string =>
  slug.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());

export default function Footer({
  offerCategories = [],
  articleCategories = [],
  dealCategories = [],
  legalPages = [],
}: FooterProps) {
  return (
    <footer className="bg-navy text-white border-t border-navy/50">
      <div className="max-w-container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-10">
          {/* Brand */}
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

          {/* Offers — same array as Header */}
          <div>
            <h4 className="font-semibold text-white mb-4 tracking-wide uppercase text-xs">Offers</h4>
            <ul className="space-y-2">
              {offerCategories.map((category) => (
                <li key={`offer-${category.id}`}>
                  <Link
                    href={`/offers/category/${category.slug}`}
                    className="text-sm text-gray-300 hover:text-yellow transition-colors"
                  >
                    {category.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Deals — same array as Header */}
          <div>
            <h4 className="font-semibold text-white mb-4 tracking-wide uppercase text-xs">Deals</h4>
            <ul className="space-y-2">
              {dealCategories.map((category) => (
                <li key={`deal-${category.id}`}>
                  <Link
                    href={`/deals/category/${category.slug}`}
                    className="text-sm text-gray-300 hover:text-yellow transition-colors"
                  >
                    {category.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal — extra data, only thing Footer specifically needs */}
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
        </div>

        {/* Newsletter */}
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
      </div>

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