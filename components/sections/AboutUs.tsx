import Image from 'next/image';
import Button from '@/components/ui/Button';
import { Check } from 'lucide-react';

const features = [
  { title: 'A Curated Experience', desc: 'Discover relevant opportunities gathered in one convenient place.' },
  { title: 'Trusted Connections', desc: 'Connect directly with businesses and service providers.' },
  { title: 'Value That Matters', desc: 'Explore opportunities designed to help you make the most of your choices.' },
  { title: 'Simple and Convenient', desc: 'Spend less time searching and more time finding what fits your needs.' },
  { title: 'Clear Information', desc: 'Make informed decisions with a better understanding of what’s available.' },
  { title: 'Always Exploring', desc: 'Discover new opportunities as they become available.' },
];

export default function AboutUs() {
  return (
    <section className="relative bg-navy text-white py-24 md:py-32 overflow-hidden" id="about-us">
      {/* Top Wave Section Divider */}
      <div className="absolute top-0 left-0 right-0 w-full overflow-hidden leading-none z-20 pointer-events-none rotate-180">
        <svg
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
          className="relative block w-full h-[35px] md:h-[60px] text-light-gray fill-current"
        >
          <path d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,42.4V120H0Z" opacity="0.15"></path>
          <path d="M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.27,48.69,38.39,101.41,83,164.41,86.42,42.79,2.33,81.42-16.71,118.51-34.9,38.21-18.73,75.31-41.22,117-48.42,43.37-7.5,88.42,1.39,129.59,16.27C1051.1,70.7,1144.33,101.07,1200,82.25V120H0Z" opacity="0.35"></path>
          <path d="M0,0V5.63C149.93,59,314.09,71.32,475.83,42.57c43-7.64,84.23-20.12,127.61-26.46,59-8.63,112.48,12.24,165.56,35.4C827.93,77.22,886,95.24,951.2,90c86.53-7,172.46-45.71,248.8-84.81V120H0Z"></path>
        </svg>
      </div>

      <div className="max-w-container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-start">
          
          {/* Image Column */}
          <div className="lg:col-span-5 relative lg:sticky lg:top-24">
            <div className="relative mx-auto max-w-[450px] lg:max-w-none">
              <div className="absolute -inset-4 rounded-3xl -rotate-2 transform transition-transform duration-300 hover:rotate-0" />
              
              <div className="relative bg-black/40 rounded-2xl overflow-hidden shadow-2xl border border-white/10 aspect-[4/5] sm:aspect-square lg:aspect-[4/5]">
                <Image
                  src="/img/about.webp"
                  alt="RafDeals - Connecting people and trusted businesses"
                  fill
                  className="object-cover transition-transform duration-500 hover:scale-105"
                  referrerPolicy="no-referrer"
                  sizes="(max-w-768px) 100vw, 500px"
                />
              </div>

              {/* Float Card */}
              <div className="absolute -bottom-6 -right-8 bg-slate-900/95 text-white  p-5 shadow-2xl border border-white/15 backdrop-blur-md hidden sm:block max-w-[250px]">
                <p className="text-xl font-extrabold text-yellow leading-tight">Better Connections.</p>
                <p className="text-xs text-gray-300 font-medium mt-2 leading-relaxed">
                  Greater Value. Bringing people and opportunities closer together.
                </p>
              </div>
            </div>
          </div>

          {/* Text Column */}
          <div className="lg:col-span-7">
            <span className="text-xs font-extrabold text-yellow tracking-widest uppercase block mb-3">
              Who We Are
            </span>
            
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight mb-8">
              A Little About RafDeals.
            </h2>
            
            <div className="space-y-5 text-gray-300 text-base sm:text-lg leading-relaxed">
              <p>
                At <strong className="text-white">RafDeals</strong>, we believe finding the right opportunity should feel simple, clear, and worthwhile. That’s why we bring people and trusted businesses together on one platform, making it easier to discover valuable opportunities, explore available options, and find what works best for them.
              </p>
              
              <p>
                We know that trust matters. With so many choices available online, knowing where to look can make all the difference. Our goal is to make that experience easier by bringing relevant opportunities together in one place and helping you connect directly with the businesses behind them.
              </p>
              
              <p>
                Whether you're exploring something new or looking for greater value in your everyday choices, <strong className="text-white">RafDeals</strong> is here to help you make informed decisions with confidence. No unnecessary complexity. No wasted time. Just a simpler way to discover opportunities that matter to you.
              </p>
            </div>

            {/* Features Grid (Small Squares) */}
            <div className="mt-12 pt-8 border-t border-white/10">
              <h3 className="text-xl sm:text-2xl font-extrabold text-white mb-6 uppercase tracking-tight">
                Why Choose RafDeals?
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-6">
                {features.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    {/* Small Yellow Square with Checkmark */}
                    <div className="flex-shrink-0 w-5 h-5 mt-0.5 bg-yellow flex items-center justify-center rounded-none">
                      <Check className="w-3.5 h-3.5 text-navy stroke-[3]" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">{feature.title}</h4>
                      <p className="text-xs text-gray-400 mt-1 leading-relaxed">{feature.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tagline & Buttons */}
            <div className="mt-12">
              <div className="flex flex-wrap gap-4">
                <Button href="/offers" variant="primary" className="rounded-none">
                  Explore Opportunities
                </Button>
                <Button href="/contact" variant="outline" className="rounded-none border-white/20 text-white hover:bg-white hover:text-navy">
                  Contact Our Team
                </Button>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Bottom Wave Section Divider */}
      <div className="absolute bottom-0 left-0 right-0 w-full overflow-hidden leading-none z-20 pointer-events-none">
        <svg
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
          className="relative block w-full h-[45px] md:h-[90px] text-light-gray fill-current"
        >
          <path d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,42.4V120H0Z" opacity="0.15"></path>
          <path d="M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.27,48.69,38.39,101.41,83,164.41,86.42,42.79,2.33,81.42-16.71,118.51-34.9,38.21-18.73,75.31-41.22,117-48.42,43.37-7.5,88.42,1.39,129.59,16.27C1051.1,70.7,1144.33,101.07,1200,82.25V120H0Z" opacity="0.35"></path>
          <path d="M0,0V5.63C149.93,59,314.09,71.32,475.83,42.57c43-7.64,84.23-20.12,127.61-26.46,59-8.63,112.48,12.24,165.56,35.4C827.93,77.22,886,95.24,951.2,90c86.53-7,172.46-45.71,248.8-84.81V120H0Z"></path>
        </svg>
      </div>
    </section>
  );
}