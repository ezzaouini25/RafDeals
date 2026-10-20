import { getFeaturedDeals } from '@/lib/queries';
import DealCard from '@/components/ui/DealCard'; // ✅ Use the MAIN DealCard component
import { ArrowRight, Flame } from 'lucide-react';
import Link from 'next/link';

export default async function FeaturedDeals() {
  try {
    const deals = await getFeaturedDeals(6);

    if (!deals || deals.length === 0) {
      return null;
    }

    return (
      <section className="relative bg-navy py-20 md:py-28 overflow-hidden">
        <div
          aria-hidden
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-yellow/10 rounded-full blur-[140px] pointer-events-none"
        />

        <div className="relative max-w-container mx-auto px-4 sm:px-6 lg:px-8 z-10">
          <div className="flex flex-col items-center text-center max-w-2xl mx-auto mb-16 md:mb-20">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 border-2 border-yellow/50 bg-yellow/10 text-yellow font-bold text-xs uppercase tracking-widest mb-6">
              <Flame size={14} className="fill-yellow" />
              Limited Time Only
            </div>

            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tight uppercase leading-[1.1]">
              Top Featured 
              <span className="text-yellow"> Deals</span>
            </h2>

            <p className="mt-6 text-slate-300 text-sm sm:text-base leading-relaxed max-w-xl">
              Discover the most popular deals on our network, selected for top reward rates, guaranteed payouts, and exclusive partner bonuses updated daily.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {deals.map((deal) => (
              <div key={deal.id} className="min-w-0">
                <DealCard deal={deal} /> {/* ✅ RENDER THE MAIN CARD HERE */}
              </div>
            ))}
          </div>

          <div className="mt-16 text-center">
            <Link
              href="/deals"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-yellow text-navy font-black text-sm uppercase tracking-widest hover:bg-white transition-colors shadow-xl border-2 border-yellow hover:border-white group rounded-none"
            >
              Browse All Deals
              <ArrowRight size={18} className="transition-transform group-hover:translate-x-1.5" />
            </Link>
          </div>
        </div>
      </section>
    );
  } catch (error) {
    console.error('Error loading featured deals:', error);
    return null;
  }
}