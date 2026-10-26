import Image from 'next/image';
import { CheckCircle, ArrowRight, ShieldCheck, Tag } from 'lucide-react';
import Button from '@/components/ui/Button';

export default function Hero() {
  return (
    <section className="relative min-h-[85vh] flex items-center bg-navy pt-20 pb-32 md:pt-28 md:pb-40 overflow-hidden z-10">
      
      {/* High-Quality Hero Cover Image */}
      <div className="absolute inset-0 z-0 select-none pointer-events-none">
        <Image
          src="/img/background.webp"
          alt="RafDeals - Premium Online Offers and Exclusive Deals"
          fill
          priority
          referrerPolicy="no-referrer"
          className="object-cover object-center scale-105"
        />
        {/* Dark overlay for elite readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-navy via-navy/60 to-navy/20 md:to-transparent" />
        <div className="absolute inset-0 bg-slate-950/10 backdrop-blur-[1px]" />
      </div>

      <div className="max-w-container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
        <div className="max-w-4xl flex flex-col items-start text-left">


          {/* Heading - Strictly 2 Lines */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-[5rem] font-black text-white leading-[1.05] tracking-tight uppercase">
            <span className="block text-white">Discover Premium </span>
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-yellow to-amber-300">
              Online Offers & Deals
            </span>
          </h1>

          {/* Humanized, Brand-Focused Description */}
          <p className="mt-6 text-lg md:text-xl text-slate-200 leading-relaxed max-w-xl font-medium">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow to-amber-300">
              RAFDeals
            </span> is one of the most trusted platforms for high reward online offers and verified deals. Every single promotion on our network is manually verified for complete safety, guaranteed earnings, and total reliability.
          </p>

          {/* Responsive Action Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <Button href="/offers" size="lg" className="min-h-12 w-full sm:w-auto shadow-xl hover:shadow-2xl hover:-translate-y-0.5 transition-all rounded-none font-bold uppercase tracking-wide">
              Explore Offers
              <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button href="/deals" variant="outline" size="lg" className="min-h-12 w-full sm:w-auto border-2 border-white/20 text-white hover:bg-white hover:text-navy hover:-translate-y-0.5 transition-all rounded-none font-bold uppercase tracking-wide">
              Browse Deals
            </Button>
          </div>

          {/* Vetted Badges */}
          <div className="mt-10 flex flex-wrap gap-y-3 gap-x-6 border-t-2 border-white/10 pt-6 w-full">
            <div className="flex items-center gap-2 text-sm text-slate-100 font-bold uppercase tracking-wide">
              <CheckCircle size={18} className="text-yellow flex-shrink-0" />
              <span>Free to Claim</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-100 font-bold uppercase tracking-wide">
              <ShieldCheck size={18} className="text-yellow flex-shrink-0" />
              <span>Manually Verified Deals</span>
            </div>
          </div>
        </div>
      </div>

      {/* Modern Wave Divider */}
      <div className="absolute bottom-0 left-0 right-0 w-full overflow-hidden leading-none z-20 pointer-events-none">
        <svg
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
          className="relative block w-full h-[45px] md:h-[90px] text-[#F8FAFC] fill-current"
        >
          <path d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,42.4V120H0Z" opacity="0.15"></path>
          <path d="M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.27,48.69,38.39,101.41,83,164.41,86.42,42.79,2.33,81.42-16.71,118.51-34.9,38.21-18.73,75.31-41.22,117-48.42,43.37-7.5,88.42,1.39,129.59,16.27C1051.1,70.7,1144.33,101.07,1200,82.25V120H0Z" opacity="0.35"></path>
          <path d="M0,0V5.63C149.93,59,314.09,71.32,475.83,42.57c43-7.64,84.23-20.12,127.61-26.46,59-8.63,112.48,12.24,165.56,35.4C827.93,77.22,886,95.24,951.2,90c86.53-7,172.46-45.71,248.8-84.81V120H0Z"></path>
        </svg>
      </div>
    </section>
  );
}