'use client';

import { useState } from 'react';
import { Plus, Minus } from 'lucide-react';
import { FAQ } from '@/types';
import { cn } from '@/lib/utils';

export default function FAQItem({ faq }: { faq: { id: number; question: string; answer: string; [key: string]: any } }) {
  const [open, setOpen] = useState(false);

  return (
    <div 
      className={cn(
        "border-2 transition-all duration-300",
        open 
          ? "border-navy bg-white shadow-md" 
          : "border-border-gray bg-white hover:border-navy/40"
      )}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 sm:p-6 text-left focus:outline-none min-h-[64px]"
        aria-expanded={open}
        aria-controls={`faq-answer-${faq.id}`}
        id={`faq-question-${faq.id}`}
      >
        <span className="font-bold text-navy pr-4 text-base sm:text-lg tracking-tight">
          {faq.question}
        </span>
        
        {/* Square Toggle Icon */}
        <div className={cn(
          "flex-shrink-0 w-8 h-8 flex items-center justify-center border-2 transition-colors",
          open 
            ? "bg-navy border-navy text-white" 
            : "bg-transparent border-navy/20 text-navy"
        )}>
          {open ? <Minus size={18} strokeWidth={3} /> : <Plus size={18} strokeWidth={3} />}
        </div>
      </button>
      
      <div
        id={`faq-answer-${faq.id}`}
        role="region"
        aria-labelledby={`faq-question-${faq.id}`}
        className={cn(
          'grid transition-all duration-300 ease-in-out',
          open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        )}
      >
        <div className="overflow-hidden">
          <div className="px-5 sm:px-6 pb-6 pt-2">
            <p className="text-gray-text text-sm sm:text-base leading-relaxed">
              {faq.answer}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}