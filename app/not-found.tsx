'use client';

import Link from 'next/link';
import { Compass, Home, AlertCircle } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[85vh] flex items-center justify-center bg-light-gray py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      
      {/* Background decorative elements */}
      <div className="absolute top-20 right-20 w-64 h-64 bg-yellow/5 border border-yellow/10 rotate-12 hidden lg:block" />
      <div className="absolute bottom-20 left-20 w-48 h-48 bg-navy/5 border border-navy/10 -rotate-12 hidden lg:block" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-yellow/5 blur-3xl pointer-events-none" />

      <div className="max-w-2xl w-full text-center relative z-10">
        
        {/* 404 with full background and border */}
        <div className="relative inline-block mb-8">
          <div className="absolute inset-0 bg-yellow/10 -translate-x-1/2 left-1/2 -translate-y-1/2 top-1/2 w-48 h-48" />
          
          {/* Full 404 with border and background */}
          <div className="bg-white border-4 border-yellow p-4 sm:p-6 md:p-8 shadow-xl relative">
            <div className="absolute -top-3 -right-3 w-6 h-6 bg-yellow border-2 border-white" />
            <div className="absolute -bottom-3 -left-3 w-6 h-6 bg-yellow border-2 border-white" />
            <div className="absolute -top-3 -left-3 w-6 h-6 bg-navy border-2 border-white" />
            <div className="absolute -bottom-3 -right-3 w-6 h-6 bg-navy border-2 border-white" />
            
            <div className="flex items-center justify-center gap-2 sm:gap-4">
              <span className="text-7xl sm:text-8xl md:text-9xl font-black text-navy tracking-tighter leading-none">
                4
              </span>
              <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 bg-yellow flex items-center justify-center border-2 border-navy">
                <Compass className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-navy stroke-[1.5]" />
              </div>
              <span className="text-7xl sm:text-8xl md:text-9xl font-black text-navy tracking-tighter leading-none">
                4
              </span>
            </div>
          </div>
        </div>

        {/* Message */}
        <div className="space-y-3 mt-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-yellow/10 border border-yellow/20 text-navy text-xs font-bold uppercase tracking-wider">
            <AlertCircle size={12} className="text-yellow" />
            Page not found
          </div>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-navy tracking-tight">
            Oops! You've wandered off course
          </h2>
          <p className="text-gray-text max-w-lg mx-auto text-sm sm:text-base leading-relaxed">
            The page or money-making guide you're looking for has been moved or doesn't exist.
          </p>
        </div>

        {/* Action Buttons - Only these two */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-navy text-white font-bold text-sm border-2 border-navy hover:bg-navy/90 transition-colors shadow-sm hover:shadow-md"
          >
            <Home size={16} />
            Back to Homepage
          </Link>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 px-6 py-3 border-2 border-border-gray text-navy font-bold text-sm hover:bg-light-gray transition-colors"
          >
            Report a Broken Link
          </Link>
        </div>

        {/* Decorative bottom */}
        <div className="mt-8 flex items-center justify-center gap-2 text-xs text-gray-text/40">
          <span>Need help finding something?</span>
          <Link href="/search" className="text-navy font-medium hover:text-yellow transition-colors">
            Try searching
          </Link>
        </div>
      </div>
    </div>
  );
}