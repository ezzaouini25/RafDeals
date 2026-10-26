import { ArrowUpRight, ShieldCheck, Users, Tag, CheckCircle2, Handshake, BarChart3 } from 'lucide-react';
import { getHomepageCounters } from '@/lib/queries';

// ============================================================
// NUMBER FORMATTING - K, M, B
// ============================================================
const formatNumber = (num: number): string => {
  if (num >= 1_000_000_000) return (num / 1_000_000_000).toFixed(1).replace(/\.0$/, '') + 'B';
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (num >= 1_000) return (num / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
  return num.toString();
};

const formatStatValue = (num: number, prefix: string = '', suffix: string = ''): string => {
  const formatted = formatNumber(num);
  return `${prefix}${formatted}${suffix}`;
};

// ============================================================
// COMPONENT
// ============================================================
export default async function StatsSection() {
  const counters = await getHomepageCounters();

  // ✅ Reads the new columns from homepage_counters
  const totalOffers    = counters?.total_offers    ?? 0; // stocked (active) offers
  const totalDeals     = counters?.total_deals     ?? 0; // stocked (active) deals
  const communityCount = counters?.total_clicks    ?? 0; // approved comments + testimonials + reviews

  const statCards = [
    // ---------------------------------------------
    // CARD 1 — OFFERS
    // ---------------------------------------------
    {
      value: totalOffers,
      suffix: '+',
      label: 'Live Online Offers',
      subLabel: 'Banks, Apps & Finance',
      metricTitle: 'OFFERS',
      icon: ShieldCheck,
      color: 'yellow',
      bgColor: 'bg-yellow-50/80 group-hover:bg-yellow-100/80',
      borderColor: 'border-yellow-200/40 group-hover:border-yellow-500/50',
      iconBg: 'bg-yellow-100 group-hover:bg-yellow-200',
      textColor: 'text-yellow-600',
      hoverTextColor: 'group-hover:text-yellow-700',
      description:
        'Every offer is manually tested before it goes live. Signup bonuses, banking apps, and finance offers — only the ones that actually pay out make it onto RafDeals.',
      stat: 'Manually Verified',
      statIcon: CheckCircle2,
    },

    // ---------------------------------------------
    // CARD 2 — DEALS
    // ---------------------------------------------
    {
      value: totalDeals,
      suffix: '+',
      label: 'Active Deals',
      subLabel: 'Pets, Beauty & Travel',
      metricTitle: 'DEALS',
      icon: Tag,
      color: 'blue',
      bgColor: 'bg-blue-50/80 group-hover:bg-blue-100/80',
      borderColor: 'border-blue-200/40 group-hover:border-blue-500/50',
      iconBg: 'bg-blue-100 group-hover:bg-blue-200',
      textColor: 'text-blue-600',
      hoverTextColor: 'group-hover:text-blue-700',
      description:
        'Real discounts on the things you buy every day. From pet supplies to beauty and travel, we keep the deal list fresh so you never chase a dead code again.',
      stat: 'Real Savings',
      statIcon: Handshake,
    },

    // ---------------------------------------------
    // CARD 3 — COMMUNITY / CLIENTS / CUSTOMERS
    // ---------------------------------------------
    {
      value: communityCount,
      suffix: '+',
      label: 'Smart Shoppers & Clients',
      subLabel: 'Growing Community',
      metricTitle: 'COMMUNITY',
      icon: Users,
      color: 'emerald',
      bgColor: 'bg-emerald-50/80 group-hover:bg-emerald-100/80',
      borderColor: 'border-emerald-200/40 group-hover:border-emerald-500/50',
      iconBg: 'bg-emerald-100 group-hover:bg-emerald-200',
      textColor: 'text-emerald-600',
      hoverTextColor: 'group-hover:text-emerald-700',
      description:
        'Customers, clients, and everyday shoppers who use RafDeals to find verified offers and exclusive deals. Real people, real savings — no inflated numbers.',
      stat: 'Verified Customers',
      statIcon: BarChart3,
    },
  ];

  return (
    <section className="relative bg-gradient-to-b from-white to-[#F8FAFC] py-20 md:py-28 lg:py-32 border-b border-border-gray/30 overflow-hidden">

      {/* Background Patterns */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f080_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f080_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none opacity-40" />

      {/* Decorative Blobs */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-yellow-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />

      <div className="max-w-container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        {/* Header */}
        <div className="flex flex-col items-center text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 border-2 border-navy text-navy font-bold text-xs uppercase tracking-widest mb-6">
            By The Numbers
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-navy tracking-tight leading-[1.1]">
            <span className="text-navy relative inline-block">
              RafDeals. 
              <span className="absolute left-0 bottom-1.5 w-full h-[6px] bg-yellow rounded-none -z-10 opacity-70" />
              Live Statistics.
            </span>
          </h2>s

          <p className="mt-4 text-sm sm:text-base text-gray-text max-w-xl mx-auto font-medium leading-relaxed">
            No inflated stats. Just a clear look at the verified online offers and exclusive deals our community is claiming right now.
          </p>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {statCards.map((stat, idx) => {
            const Icon = stat.icon;
            const StatIcon = stat.statIcon;
            const displayValue = formatStatValue(stat.value, (stat as any).prefix || '', stat.suffix || '');

            return (
              <div
                key={idx}
                className={`group relative bg-white border-2 ${stat.borderColor} p-8 transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 cursor-pointer overflow-hidden rounded-none`}
              >
                {/* Hover Background */}
                <div className={`absolute inset-0 ${stat.bgColor} transition-all duration-500`} />

                {/* Top Accent Line */}
                <div className={`absolute top-0 left-0 right-0 h-1.5 ${stat.bgColor} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

                {/* Content */}
                <div className="relative z-10">

                  {/* Header with Icon */}
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        {stat.metricTitle}
                      </span>
                      <p className="text-sm font-bold text-navy mt-1">{stat.subLabel}</p>
                    </div>
                    <div className={`w-12 h-12 ${stat.iconBg} flex items-center justify-center transition-all duration-500 group-hover:scale-110 shadow-sm rounded-none`}>
                      <Icon className={`w-6 h-6 ${stat.textColor}`} />
                    </div>
                  </div>

                  {/* Number */}
                  <p className={`text-5xl sm:text-6xl lg:text-7xl font-black text-navy tracking-tighter leading-none mb-3 transition-colors duration-300 ${stat.hoverTextColor}`}>
                    {displayValue}
                  </p>

                  {/* Label */}
                  <p className="text-sm font-bold text-navy mb-3 transition-colors duration-300 group-hover:text-navy/70">
                    {stat.label}
                  </p>

                  {/* Description */}
                  <p className="text-sm text-gray-500 leading-relaxed">
                    {stat.description}
                  </p>

                  {/* Footer */}
                  <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200/50">
                    <span className="flex items-center gap-1.5 text-xs font-bold text-gray-400">
                      <StatIcon className={`w-3.5 h-3.5 ${stat.textColor}`} />
                      {stat.stat}
                    </span>
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