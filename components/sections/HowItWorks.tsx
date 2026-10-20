import { Tag, MousePointerClick, ShoppingBag, ArrowRight } from 'lucide-react';

const steps = [
  {
    number: '01',
    icon: Tag,
    title: 'Discover Verified Deals',
    description: 'Browse our hand-picked, strictly verified list of exclusive discounts, cashback offers, and signup bonuses.',
  },
  {
    number: '02',
    icon: MousePointerClick,
    title: 'Claim the Offer',
    description: 'Click through to the merchant and secure your deal. We only partner with trusted platforms with zero hidden fees.',
  },
  {
    number: '03',
    icon: ShoppingBag,
    title: 'Enjoy Your Savings',
    description: 'Receive your cashback, gift cards, or discounts directly. Keep more money in your pocket with every purchase.',
  },
];

export default function HowItWorks() {
  return (
    <section className="relative bg-white py-20 md:py-28 border-b border-border-gray/70 overflow-hidden" id="how-it-works">
      
      {/* Background Pattern (Subtle Grid) */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

      <div className="relative max-w-container mx-auto px-4 sm:px-6 lg:px-8 z-10">
        
        {/* Header */}
        <div className="flex flex-col items-center text-center max-w-2xl mx-auto mb-16 md:mb-20">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 border-2 border-navy text-navy font-bold text-xs uppercase tracking-widest mb-6">
            Simple Process
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-navy tracking-tight uppercase leading-[1.1]">
            How RafDeals Works
          </h2>
          <p className="mt-4 text-base md:text-lg text-gray-text leading-relaxed">
            We cut through the noise to bring you the best offers. In three simple steps, you can start saving money on the things you already buy.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div 
                key={step.number} 
                className="group relative bg-white border-2 border-border-gray p-8 flex flex-col justify-between transition-all duration-300 hover:border-navy hover:shadow-2xl"
              >
                {/* Top accent bar that appears on hover */}
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-yellow scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-300" />

                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-8">
                    {/* Sharp Icon Box */}
                    <div className="w-14 h-14 bg-light-gray flex items-center justify-center transition-colors duration-300 group-hover:bg-yellow">
                      <Icon size={26} className="text-navy" />
                    </div>
                    
                    {/* Huge Watermark Number */}
                    <span className="text-7xl font-black text-gray-200 tracking-tighter select-none leading-none -mt-4 -mr-2 transition-colors duration-300 group-hover:text-yellow/60">
                      {step.number}
                    </span>
                  </div>

                  <h3 className="text-xl sm:text-2xl font-black text-navy uppercase tracking-tight mb-3">
                    {step.title}
                  </h3>
                  
                  <p className="text-gray-text text-sm md:text-base leading-relaxed mb-6">
                    {step.description}
                  </p>
                </div>

                {/* Footer CTA */}
                <div className="mt-auto pt-6 border-t border-border-gray/50 flex items-center justify-between">
                  <span className="text-xs font-black text-navy/60 uppercase tracking-widest group-hover:text-navy transition-colors">
                    Step {step.number}
                  </span>
                  
                  <div className="w-8 h-8 bg-transparent border border-border-gray flex items-center justify-center transition-all duration-300 group-hover:bg-navy group-hover:border-navy">
                    <ArrowRight size={16} className="text-navy group-hover:text-white transform group-hover:-rotate-45 transition-all duration-300" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}