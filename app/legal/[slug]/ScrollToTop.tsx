'use client';

import { ArrowLeft } from 'lucide-react';

export default function ScrollToTop() {
  const handleScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <button
      onClick={handleScrollToTop}
      className="inline-flex items-center gap-2 text-sm font-medium text-gray-text hover:text-navy transition-colors"
    >
      <ArrowLeft size={14} className="rotate-90" />
      Back to top
    </button>
  );
}