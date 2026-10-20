import { getFeaturedOffers } from '@/lib/queries';
import OfferCard from '@/components/ui/OfferCard';
import Button from '@/components/ui/Button';
import { ArrowRight, Tag } from 'lucide-react';

export default async function FeaturedOffers() {
  try {
    const offers = await getFeaturedOffers(6);

    if (!offers || offers.length === 0) {
      return null;
    }

    return (
      <section className="relative bg-white py-20 md:py-28 overflow-hidden">
        
        {/* Subtle background pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />

        <div className="relative max-w-container mx-auto px-4 sm:px-6 lg:px-8 z-10">
          
          {/* Header */}
          <div className="flex flex-col items-center text-center max-w-2xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 border-2 border-navy text-navy font-bold text-xs uppercase tracking-widest mb-6">
              <Tag size={14} />
              Exclusive Deals
            </div>
            
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-navy tracking-tight uppercase leading-[1.1]">
              Top Featured Offers
            </h2>
            
            <p className="mt-4 text-base md:text-lg text-gray-text leading-relaxed">
              Discover the most popular offers on our network, selected for their top reward rates, verified payouts, and exclusive partner bonuses updated daily.
            </p>
          </div>

          {/* Offers Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {offers.map((offer) => (
              <OfferCard key={offer.id} offer={offer} />
            ))}
          </div>

          {/* View All Button */}
          <div className="mt-16 text-center">
            <Button 
              href="/offers" 
              variant="outline" 
              size="md" 
              className="min-h-12 px-8 border-2 border-navy text-navy font-black uppercase tracking-widest hover:bg-navy hover:text-white transition-all rounded-none"
            >
              View All Offers
              <ArrowRight size={18} className="ml-2" />
            </Button>
          </div>

        </div>
      </section>
    );
  } catch (error) {
    console.error('Error loading featured offers:', error);
    return null;
  }
}