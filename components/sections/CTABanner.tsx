import Button from '@/components/ui/Button';
import { ArrowRight, Shield } from 'lucide-react';

export default function CTABanner() {
  return (
    <section className="py-24 bg-white relative overflow-hidden" id="cta-banner-section">
      <div className="max-w-container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden bg-gradient-to-b from-navy to-[#0b132b] text-white p-8 md:p-20 shadow-2xl border border-white/10 text-center flex flex-col items-center">
          {/* Ambient center background glows */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-yellow/10 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />

          <div className="relative z-10 max-w-3xl mx-auto flex flex-col items-center">

            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight">
              Ready to Find Your Next Deal?
            </h2>

            <p className="mt-5 text-gray-300 text-sm sm:text-base md:text-lg leading-relaxed max-w-xl">
              Discover a rigorously audited ecosystem of verified online offers and exclusive deals. We personally inspect every single promotion so you can claim with absolute confidence, zero friction, and total security.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center w-full sm:w-auto">
              <Button href="/blog" variant="primary" size="lg" className="min-h-12 font-bold px-8 shadow-xl shadow-yellow/10 w-full sm:w-auto rounded-none">
                Explore Offers
                <ArrowRight size={18} className="ml-2 inline-block group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button href="/guide" variant="outline" size="lg" className="min-h-12 text-white border-white/20 hover:bg-white/10 hover:text-white w-full sm:w-auto rounded-none">
                Read Strategy Guides
              </Button>
            </div>

            <div className="mt-8 flex items-center justify-center gap-2 text-xs font-semibold tracking-wider text-white/50 uppercase">
              <Shield size={14} className="text-emerald-500" />
              <span>Manually Verified &amp; Scam-Free Guarantee</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}