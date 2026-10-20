import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className="flex items-center justify-center gap-2">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="p-2 border border-border-gray rounded-lg hover:bg-light-gray disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
        aria-label="Previous page"
      >
        <ChevronLeft size={18} />
      </button>

      {pages.map((page) => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={cn(
            'w-10 h-10 rounded-lg text-sm font-medium transition-colors flex items-center justify-center',
            currentPage === page
              ? 'bg-navy text-white'
              : 'border border-border-gray hover:bg-light-gray text-gray-text'
          )}
        >
          {page}
        </button>
      ))}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="p-2 border border-border-gray rounded-lg hover:bg-light-gray disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
        aria-label="Next page"
      >
        <ChevronRight size={18} />
      </button>
    </div>
  );
}
