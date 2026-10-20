'use client';

import { useEffect } from 'react';
import Button from '@/components/ui/Button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center bg-light-gray px-4">
      <div className="text-center max-w-md">
        <h1 className="text-8xl font-extrabold text-navy/10 leading-none">500</h1>
        <h2 className="text-2xl font-bold text-navy mt-4">Something Went Wrong</h2>
        <p className="mt-3 text-gray-text leading-relaxed">
          We experienced a small technical hiccup. Please try reloading the page.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Button onClick={reset} size="md" className="min-h-11">
            Try Again
          </Button>
          <Button href="/" variant="outline" size="md" className="min-h-11">
            Go Back Home
          </Button>
        </div>
      </div>
    </div>
  );
}
