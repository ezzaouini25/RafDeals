'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Activity,
  ArrowDown,
  ArrowUp,
  Calendar,
  ChevronRight,
  Clock,
  Eye,
  FileText,
  Filter,
  Gift,
  Loader2,
  Mail,
  MessageCircle,
  MessageSquare,
  MousePointerClick,
  Quote,
  RefreshCw,
  Star,
  Tag,
  User,
  X,
  Sparkles,
  Copy,
  Check,
  Info,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

// ============================================================
// TYPES
// ============================================================
type TopPeriod = 'today' | 'week' | 'allTime';
type ViewMode = 'week' | 'month';

interface StatData {
  total: number;
  thisWeek: number;
  lastWeek: number;
  change: { percent: number; isUp: boolean };
}

interface WeeklyData {
  date: string;
  views: number;
  clicks?: number;
}

interface TopItem {
  id: number;
  title: string;
  views: number;
  clicks?: number;
  cover_image?: string;
}

interface ContactMessageItem {
  id: number;
  name: string;
  email: string;
  subject?: string;
  message: string;
  created_at: string;
}

interface ComparisonSeries {
  current: WeeklyData[];
  previous: WeeklyData[];
}

interface DashboardData {
  articles: StatData;
  offers: StatData;
  deals: StatData;
  subscribers: StatData;
  reviews: StatData;
  comments: StatData;
  testimonials: StatData;
  contacts: StatData;

  weeklyOffers: WeeklyData[];
  weeklyDeals: WeeklyData[];
  weeklyArticles: WeeklyData[];
  weeklySubscribers: WeeklyData[];
  weeklyReviews: WeeklyData[];
  weeklyComments: WeeklyData[];
  weeklyTestimonials: WeeklyData[];
  weeklyContacts: WeeklyData[];

  topArticles: Record<TopPeriod, TopItem[]>;
  topOffers: Record<TopPeriod, TopItem[]>;
  topDeals: Record<TopPeriod, TopItem[]>;
  contactMessages?: ContactMessageItem[];
}

// ============================================================
// HELPERS
// ============================================================
const AXIS_TICK = { fontSize: 10, fill: '#94a3b8' };

const palette = {
  views: '#3b82f6',
  clicks: '#f59e0b',
  offers: '#10b981',
  deals: '#f97316',
  articles: '#6366f1',
  previous: '#94a3b8',
};

function gradientId(color: string) {
  return `grad-anim-${color.replace('#', '')}`;
}

function formatRelativeTime(dateString: string) {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (isNaN(seconds) || seconds < 0) return 'Just now';

    let interval = Math.floor(seconds / 31536000);
    if (interval >= 1) return `${interval}y ago`;
    interval = Math.floor(seconds / 2592000);
    if (interval >= 1) return `${interval}mo ago`;
    interval = Math.floor(seconds / 86400);
    if (interval >= 1) return `${interval}d ago`;
    interval = Math.floor(seconds / 3600);
    if (interval >= 1) return `${interval}h ago`;
    interval = Math.floor(seconds / 60);
    if (interval >= 1) return `${interval}m ago`;
    return 'Just now';
  } catch {
    return 'Recently';
  }
}

function formatSafeDate(label: unknown, withYear = true) {
  let displayDate = '';
  try {
    if (typeof label === 'string' && label.includes('-')) {
      const parts = label.split('-');
      if (parts.length === 3) {
        const dateObj = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        if (!Number.isNaN(dateObj.getTime()) && dateObj.getFullYear() > 1970) {
          displayDate = dateObj.toLocaleDateString(
            'en-US',
            withYear
              ? { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }
              : { month: 'short', day: 'numeric' }
          );
        }
      }
    }
    if (!displayDate) {
      const dateObj = new Date(label as string);
      if (!Number.isNaN(dateObj.getTime()) && dateObj.getFullYear() > 1970) {
        displayDate = dateObj.toLocaleDateString(
          'en-US',
          withYear
            ? { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }
            : { month: 'short', day: 'numeric' }
        );
      }
    }
  } catch {
    displayDate = String(label ?? '');
  }
  return !displayDate || displayDate === 'Invalid Date' ? 'No date' : displayDate;
}

function normalizeSeries(data: WeeklyData[] | undefined, includeClicks: boolean): WeeklyData[] {
  const today = new Date();
  const defaultSevenDays: WeeklyData[] = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    defaultSevenDays.push({
      date: dateStr,
      views: 0,
      ...(includeClicks ? { clicks: 0 } : {}),
    });
  }

  if (!Array.isArray(data) || data.length === 0) {
    return defaultSevenDays;
  }

  return defaultSevenDays.map((defaultItem) => {
    const found = data.find((item) => item.date === defaultItem.date);
    if (found) {
      return {
        date: defaultItem.date,
        views: Number(found.views ?? 0),
        ...(includeClicks ? { clicks: Number(found.clicks ?? 0) } : {}),
      };
    }
    return defaultItem;
  });
}

// ============================================================
// CUSTOM TOOLTIPS
// ============================================================
function ChartTooltip({ active, payload, label, accent = '#f59e0b' }: any) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="rounded-none border border-slate-700 bg-slate-900/95 p-3 shadow-2xl backdrop-blur-md relative z-[9999]" style={{ borderTop: `3px solid ${accent}` }}>
      <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">{formatSafeDate(label)}</p>
      {payload.map((entry: any, index: number) => {
        const name = String(entry.name ?? entry.dataKey ?? 'Metric');
        const isViews = name === 'Views' || entry.dataKey === 'views';
        const isClicks = name === 'Clicks' || entry.dataKey === 'clicks';

        return (
          <div key={`${entry.dataKey}-${index}`} className="flex items-center justify-between gap-4 py-1 text-xs">
            <span className="flex items-center gap-2 font-semibold text-slate-300">
              {isViews ? (
                <Eye size={13} className="text-blue-400" />
              ) : isClicks ? (
                <MousePointerClick size={13} className="text-amber-400" />
              ) : (
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
              )}
              {name}
            </span>
            <span className="font-black text-white">{Number(entry.value ?? 0).toLocaleString()}</span>
          </div>
        );
      })}
    </div>
  );
}

function SparklineTooltip({ active, payload, label, icon: Icon = Eye, iconColor = 'text-blue-400', labelText = 'views' }: any) {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="rounded-none border border-slate-700 bg-slate-900/95 p-2 shadow-xl relative z-[9999]">
      <p className="mb-1 text-[9px] font-bold text-slate-400 uppercase tracking-wider">{formatSafeDate(label, false)}</p>
      <p className="flex items-center gap-1.5 text-xs font-extrabold text-white">
        <Icon size={12} className={iconColor} />
        {Number(payload[0]?.value ?? 0).toLocaleString()} {labelText}
      </p>
    </div>
  );
}

function DonutTooltip({ active, payload }: any) {
  if (!active || !payload || !payload.length) return null;
  const item = payload[0];

  return (
    <div className="rounded-none border border-slate-700 bg-slate-900/95 p-2.5 shadow-2xl relative z-[9999]" style={{ borderTop: `3px solid ${item.payload?.color}` }}>
      <p className="mb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Traffic Share</p>
      <div className="flex items-center justify-between gap-3 text-xs">
        <span className="flex items-center gap-2 font-semibold text-slate-300">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.payload?.color }} />
          {item.name}
        </span>
        <span className="font-black text-white">{Number(item.value ?? 0).toLocaleString()}</span>
      </div>
      <div className="mt-1 flex items-center justify-between gap-3 text-[11px] text-slate-400">
        <span>Share ratio</span>
        <span className="font-bold text-slate-200">{item.payload?.percent ?? 0}%</span>
      </div>
    </div>
  );
}

// ============================================================
// ENHANCED STAT CARD
// ============================================================
function EnhancedStatCard({
  title,
  data,
  icon: Icon,
  color,
  href,
  sparklineData,
  sparklineColor,
  tooltipIcon: TooltipIcon = Eye,
  tooltipIconColor = 'text-blue-400',
  tooltipLabel = 'views',
  badgeText = 'Active Tracking',
}: {
  title: string;
  data: StatData;
  icon: any;
  color: string;
  href: string;
  sparklineData?: WeeklyData[];
  sparklineColor?: string;
  tooltipIcon?: any;
  tooltipIconColor?: string;
  tooltipLabel?: string;
  badgeText?: string;
}) {
  const isUp = data?.change?.isUp ?? true;
  const percent = data?.change?.percent ?? 0;
  const safeSparkline = normalizeSeries(sparklineData, false);

  return (
    <Link
      href={href}
      className="group relative block rounded-none border border-slate-200 bg-white p-5 transition-all duration-200 hover:border-slate-400 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 hover:z-10"
    >
      <div className="relative z-10">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`rounded-none border border-slate-200 p-2.5 ${color} bg-opacity-10 dark:border-slate-800`}>
              <Icon size={18} className={color} />
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{title}</h3>
              <span className="text-[10px] font-semibold text-slate-400">{badgeText}</span>
            </div>
          </div>
          <div className="flex items-center gap-1 rounded-none border border-slate-200 bg-slate-50 px-2 py-0.5 dark:border-slate-700 dark:bg-slate-800">
            {isUp ? <ArrowUp size={11} className="text-emerald-500" /> : <ArrowDown size={11} className="text-rose-500" />}
            <span className={`text-[11px] font-black ${isUp ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {Math.abs(percent)}%
            </span>
          </div>
        </div>

        <div className="mb-3">
          <p className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
            {(data?.total ?? 0).toLocaleString()}
          </p>
        </div>

        <div className="relative h-14 w-full mb-3 rounded-none bg-slate-50/50 dark:bg-slate-800/30 p-2 border border-slate-200 dark:border-slate-800">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={safeSparkline}>
              <Line
                type="monotone"
                dataKey="views"
                stroke={sparklineColor || '#818cf8'}
                strokeWidth={2}
                dot={false}
                isAnimationActive={true}
                animationDuration={1200}
                activeDot={{ r: 3, stroke: sparklineColor || '#818cf8', strokeWidth: 2 }}
              />
              <Tooltip content={<SparklineTooltip icon={TooltipIcon} iconColor={tooltipIconColor} labelText={tooltipLabel} />} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
          <div className="rounded-none bg-slate-50 dark:bg-slate-800/50 p-2 border border-slate-200 dark:border-slate-800">
            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">This Week</p>
            <p className="text-xs font-black text-slate-800 dark:text-slate-200 mt-0.5">{(data?.thisWeek ?? 0).toLocaleString()}</p>
          </div>
          <div className="rounded-none bg-slate-50 dark:bg-slate-800/50 p-2 border border-slate-200 dark:border-slate-800">
            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Last Week</p>
            <p className="text-xs font-black text-slate-500 dark:text-slate-400 mt-0.5">{(data?.lastWeek ?? 0).toLocaleString()}</p>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 group-hover:text-amber-500">
          <span>Manage {title}</span>
          <ChevronRight size={14} className="transition-transform group-hover:translate-x-1" />
        </div>
      </div>
    </Link>
  );
}

// ============================================================
// TOP CONTENT CARD
// ============================================================
function TopContentCard({ items, type }: { items: TopItem[]; type: 'article' | 'offer' | 'deal' }) {
  if (!items || items.length === 0) {
    return (
      <div className="rounded-none border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <p className="rounded-none border border-dashed border-slate-200 py-8 text-center text-xs font-medium text-slate-400 dark:border-slate-800">
          No records found
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-none border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <div className="space-y-3">
        {items.map((item, index) => {
          const href =
            type === 'article'
              ? `/admin/articles/edit/${item.id}`
              : type === 'deal'
                ? `/admin/deals/edit/${item.id}`
                : `/admin/offers/edit/${item.id}`;

          return (
            <Link
              key={item.id}
              href={href}
              className="group flex items-center gap-3 rounded-none border border-slate-200 bg-slate-50/60 p-2.5 transition-all hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800/40 dark:hover:bg-slate-800"
            >
              <div className="h-10 w-10 shrink-0 overflow-hidden rounded-none border border-slate-200 bg-slate-200 dark:border-slate-700 dark:bg-slate-800">
                {item.cover_image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.cover_image} alt={item.title} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-slate-400">
                    {type === 'article' ? <FileText size={16} /> : type === 'deal' ? <Tag size={16} /> : <Gift size={16} />}
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold text-slate-900 transition-colors group-hover:text-amber-500 dark:text-white">
                  <span className="mr-1.5 font-black text-slate-400">#{index + 1}</span> {item.title}
                </p>
                <div className="mt-1 flex items-center gap-3 text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1">
                    <Eye size={12} className="text-blue-500" />
                    {item.views || 0} views
                  </span>
                  {type !== 'article' && item.clicks !== undefined && (
                    <span className="flex items-center gap-1">
                      <MousePointerClick size={12} className="text-amber-500" />
                      {item.clicks || 0} clicks
                    </span>
                  )}
                </div>
              </div>

              <ChevronRight size={14} className="shrink-0 text-slate-400 transition-transform group-hover:translate-x-1" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// AREA CHART CARD (FIXED DYNAMIC HEIGHT CONTROL)
// ============================================================
function ModernAreaChartCard({
  title,
  icon: Icon,
  iconColor,
  accent,
  data,
  dataKey1,
  dataKey2,
  color1,
  color2,
  label1,
  label2,
  showClicks = true,
  chartHeight = 'h-75',
}: {
  title: string;
  icon: any;
  iconColor: string;
  accent: string;
  data: WeeklyData[];
  dataKey1: string;
  dataKey2?: string;
  color1: string;
  color2?: string;
  label1: string;
  label2?: string;
  showClicks?: boolean;
  chartHeight?: string;
}) {
  const includeClicks = showClicks && !!dataKey2;
  const safeData = normalizeSeries(data, includeClicks);

  const total1 = safeData.reduce((sum, item: any) => sum + Number(item[dataKey1] ?? 0), 0);
  const total2 = includeClicks ? safeData.reduce((sum, item: any) => sum + Number(item[dataKey2] ?? 0), 0) : 0;
  const allZero = total1 === 0 && total2 === 0;

  const gid1 = gradientId(color1);
  const gid2 = color2 ? gradientId(color2) : '';

  return (
    <section
      className="relative rounded-none border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 transition-all hover:border-slate-300 w-full flex flex-col justify-between"
      style={{ borderTop: `3px solid ${accent}` }}
    >
      <div className="relative z-20 flex-1 flex flex-col justify-between">
        <div className="mb-4 flex flex-col gap-3 border-b border-slate-100 pb-3 dark:border-slate-800 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-none border border-slate-200 p-2.5 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
              <Icon size={18} className={iconColor} />
            </div>
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">{title}</h3>
              <p className="text-[11px] font-semibold text-slate-400">
                {includeClicks ? 'Views & click engagement metrics' : 'Traffic trend overview'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-none border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
              <span className="h-2.5 w-2.5 rounded-none" style={{ backgroundColor: color1 }} />
              {label1}: <span className="font-black text-slate-900 dark:text-white">{total1.toLocaleString()}</span>
            </span>
            {includeClicks && color2 && (
              <span className="inline-flex items-center gap-1.5 rounded-none border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                <span className="h-2.5 w-2.5 rounded-none" style={{ backgroundColor: color2 }} />
                {label2}: <span className="font-black text-slate-900 dark:text-white">{total2.toLocaleString()}</span>
              </span>
            )}
          </div>
        </div>

        <div className={`w-full ${chartHeight} rounded-none border border-slate-100 bg-slate-50/40 p-2 dark:border-slate-800 dark:bg-slate-950/40 relative z-20`}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={safeData} margin={{ top: 10, right: 10, left: -18, bottom: 0 }}>
              <defs>
                <linearGradient id={gid1} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color1} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={color1} stopOpacity={0} />
                </linearGradient>
                {includeClicks && color2 && (
                  <linearGradient id={gid2} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={color2} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={color2} stopOpacity={0} />
                  </linearGradient>
                )}
              </defs>

              <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.3} />
              <XAxis
                dataKey="date"
                tick={AXIS_TICK}
                axisLine={false}
                tickLine={false}
                tickFormatter={(value) => {
                  const date = new Date(value);
                  if (Number.isNaN(date.getTime())) return String(value);
                  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                }}
              />
              <YAxis 
                tick={AXIS_TICK} 
                axisLine={false} 
                tickLine={false} 
                width={46} 
                domain={allZero ? [0, 10] : ['auto', 'auto']}
              />
              <Tooltip
                content={<ChartTooltip accent={accent} />}
                cursor={{ stroke: accent, strokeWidth: 1.5, strokeDasharray: '4 4' }}
                wrapperStyle={{ zIndex: 9999, outline: 'none' }}
              />
              <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} iconType="square" />

              <Area
                type="monotone"
                dataKey={dataKey1}
                stroke={color1}
                strokeWidth={2.5}
                fill={`url(#${gid1})`}
                name={label1}
                isAnimationActive={true}
                animationDuration={1500}
                activeDot={{ r: 5, strokeWidth: 0 }}
              />
              {includeClicks && color2 && (
                <Area
                  type="monotone"
                  dataKey={dataKey2}
                  stroke={color2}
                  strokeWidth={2.5}
                  fill={`url(#${gid2})`}
                  name={label2}
                  isAnimationActive={true}
                  animationDuration={1500}
                  animationBegin={200}
                  activeDot={{ r: 5, strokeWidth: 0 }}
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
}

// ============================================================
// CONTENT DISTRIBUTION CARD
// ============================================================
function DistributionCard({
  articles,
  offers,
  deals,
}: {
  articles: StatData;
  offers: StatData;
  deals: StatData;
}) {
  const [selectedCategory, setSelectedCategory] = useState<{
    name: string;
    value: number;
    percent: number;
    color: string;
    description: string;
  } | null>(null);

  const raw = [
    { 
      name: 'Articles', 
      value: Number(articles?.total ?? 0), 
      color: palette.articles,
      description: 'Published written content, editorial posts, and news articles currently live on platform.' 
    },
    { 
      name: 'Offers', 
      value: Number(offers?.total ?? 0), 
      color: palette.offers,
      description: 'Active promotional offers and campaigns tracked across visitor sessions.' 
    },
    { 
      name: 'Deals', 
      value: Number(deals?.total ?? 0), 
      color: palette.deals,
      description: 'Featured discount codes, daily promo deals, and partner pricing offers.' 
    },
  ];

  const total = raw.reduce((sum, item) => sum + item.value, 0);
  const donutData = raw.map((item) => ({
    ...item,
    percent: total > 0 ? Number(((item.value / total) * 100).toFixed(1)) : 0,
  }));

  return (
    <section
      className="relative rounded-none border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 transition-all hover:border-slate-300"
      style={{ borderTop: '3px solid #ec4899' }}
    >
      <div className="relative z-10">
        <div className="mb-5 flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="rounded-none border border-slate-200 p-2.5 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
              <Activity size={18} className="text-pink-500" />
            </div>
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Content Distribution
              </h3>
              <p className="text-[11px] font-semibold text-slate-400">
                Articles, offers & deals ratio
              </p>
            </div>
          </div>
        </div>

        <div className="relative mx-auto h-52 w-full max-w-[260px] sm:h-56 sm:max-w-[280px] cursor-pointer">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={donutData}
                dataKey="value"
                nameKey="name"
                innerRadius="65%"
                outerRadius="90%"
                paddingAngle={2}
                stroke="#ffffff"
                strokeWidth={2}
                isAnimationActive={true}
                animationDuration={1200}
                onClick={(entry) => {
                  const found = donutData.find((d) => d.name === entry.name);
                  if (found) setSelectedCategory(found);
                }}
              >
                {donutData.map((entry) => (
                  <Cell 
                    key={entry.name} 
                    fill={entry.color} 
                    className="cursor-pointer transition-opacity hover:opacity-80" 
                  />
                ))}
              </Pie>
              <Tooltip content={<DonutTooltip />} wrapperStyle={{ zIndex: 9999, outline: 'none' }} />
            </PieChart>
          </ResponsiveContainer>

          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center bg-white dark:bg-slate-900 rounded-full w-28 h-28 m-auto shadow-sm z-10">
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Total Volume</p>
            <p className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              {total.toLocaleString()}
            </p>
            <p className="text-[9px] font-bold text-slate-400">indexed items</p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {donutData.map((item) => (
            <div
              key={item.name}
              onClick={() => setSelectedCategory(item)}
              className="rounded-none p-3 border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex flex-col justify-between cursor-pointer transition-all hover:scale-[1.02] hover:border-amber-500"
              style={{ borderLeft: `3px solid ${item.color}` }}
            >
              <div className="flex items-center justify-between gap-1.5">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-200 truncate">
                    {item.name}
                  </span>
                </div>
                <span className="text-xs font-black text-slate-900 dark:text-white shrink-0">
                  {item.value.toLocaleString()}
                </span>
              </div>

              <div className="mt-2 h-1.5 w-full bg-slate-200 dark:bg-slate-700 overflow-hidden rounded-none">
                <div
                  className="h-full rounded-none transition-all duration-1000"
                  style={{ width: `${item.percent}%`, backgroundColor: item.color }}
                />
              </div>

              <div className="mt-2 flex items-center justify-between text-[10px] font-bold text-slate-400">
                <span>{item.percent}% share</span>
              </div>
              <span className="text-amber-500 text-[10px] hover:underline flex items-center gap-1">Details <Info size={10} /></span>
            </div>
          ))}
        </div>
      </div>

      {selectedCategory && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-none border border-slate-700 bg-slate-900 p-6 shadow-2xl text-white relative z-[10000]">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: selectedCategory.color }} />
                <h3 className="text-sm font-black uppercase tracking-wider text-white">
                  {selectedCategory.name} Overview
                </h3>
              </div>
              <button
                onClick={() => setSelectedCategory(null)}
                className="rounded-none p-1 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-800/80 p-3 border border-slate-700">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Count</p>
                  <p className="text-xl font-black text-white mt-1">{selectedCategory.value.toLocaleString()}</p>
                </div>
                <div className="bg-slate-800/80 p-3 border border-slate-700">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Platform Share</p>
                  <p className="text-xl font-black text-amber-400 mt-1">{selectedCategory.percent}%</p>
                </div>
              </div>

              <div className="bg-slate-800/50 p-3.5 border border-slate-700/80">
                <p className="text-xs font-bold text-slate-300 uppercase tracking-wide mb-1">Description</p>
                <p className="text-xs text-slate-400 leading-relaxed">{selectedCategory.description}</p>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedCategory(null)}
                className="w-full bg-amber-500 text-slate-950 font-bold text-xs uppercase tracking-wider py-2.5 hover:bg-amber-400 transition-colors shadow-md"
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

// ============================================================
// RECENT MESSAGES WIDGET SECTION
// ============================================================
function ContactMessagesCard({ messages }: { messages?: ContactMessageItem[] }) {
  const [selectedMessage, setSelectedMessage] = useState<ContactMessageItem | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCopyEmail = (email: string) => {
    navigator.clipboard.writeText(email);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getAvatarColor = (name: string) => {
    const colors = ['bg-blue-600', 'bg-emerald-600', 'bg-amber-600', 'bg-purple-600', 'bg-indigo-600', 'bg-teal-600'];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const topThreeMessages = messages?.slice(0, 3) || [];

  return (
    <>
      <section
        className="relative rounded-none border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 transition-all hover:border-slate-300 flex flex-col justify-between"
        style={{ borderTop: '3px solid #3b82f6' }}
      >
        <div>
          <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="rounded-none border border-slate-200 p-2.5 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                <Mail size={18} className="text-blue-500" />
              </div>
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  Recent Messages
                </h3>
                <p className="text-[11px] font-semibold text-slate-400">Latest contact inquiries</p>
              </div>
            </div>
            <span className="rounded-none border border-blue-200 bg-blue-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-blue-600 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-400">
              Last 3
            </span>
          </div>

          <div className="space-y-2.5">
            {topThreeMessages.length > 0 ? (
              topThreeMessages.map((msg) => {
                const firstChar = msg.name ? msg.name.charAt(0).toUpperCase() : '?';
                const avatarBg = getAvatarColor(msg.name || 'User');

                return (
                  <div
                    key={msg.id}
                    onClick={() => setSelectedMessage(msg)}
                    className="p-3 bg-slate-50/60 dark:bg-slate-800/40 rounded-none border border-slate-200 dark:border-slate-700 transition hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer flex items-center gap-3 group"
                  >
                    <div className={`h-8 w-8 shrink-0 rounded-full ${avatarBg} text-white font-black text-xs flex items-center justify-center shadow-sm`}>
                      {firstChar}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex justify-between items-center mb-0.5">
                        <span className="font-bold text-xs text-slate-900 dark:text-white truncate group-hover:text-blue-500 transition-colors">
                          {msg.name}
                        </span>
                        <span className="text-[10px] font-medium text-slate-400 shrink-0">
                          {formatRelativeTime(msg.created_at)}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 truncate">
                        {msg.subject || msg.message}
                      </p>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="rounded-none border border-dashed border-slate-200 dark:border-slate-800 py-6 text-center text-xs font-medium text-slate-400">
                No recent messages found
              </p>
            )}
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-right">
          <Link
            href="/admin/contacts"
            className="inline-flex items-center gap-1 text-xs font-bold text-slate-700 hover:text-amber-500 dark:text-slate-300 transition-colors"
          >
            View all inquiries <ChevronRight size={14} />
          </Link>
        </div>
      </section>

      {/* POPUP MODAL FOR MESSAGE DETAILS */}
      {selectedMessage && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-none border border-slate-700 bg-slate-900 p-6 shadow-2xl text-white relative z-[10000]">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2.5">
                <div className={`h-8 w-8 rounded-full ${getAvatarColor(selectedMessage.name)} text-white font-black text-xs flex items-center justify-center`}>
                  {selectedMessage.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">{selectedMessage.name}</h3>
                  <p className="text-[10px] text-slate-400">{formatSafeDate(selectedMessage.created_at)} ({formatRelativeTime(selectedMessage.created_at)})</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedMessage(null)}
                className="rounded-none p-1 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-slate-800/80 p-3.5 border border-slate-700 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Sender Email</p>
                  <p className="text-xs font-mono text-blue-400 truncate mt-0.5">{selectedMessage.email}</p>
                </div>
                <button
                  onClick={() => handleCopyEmail(selectedMessage.email)}
                  className="shrink-0 flex items-center gap-1 bg-slate-700 hover:bg-slate-600 text-white px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors rounded-none"
                >
                  {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  {copied ? 'Copied' : 'Copy Email'}
                </button>
              </div>

              <div className="bg-slate-800/80 p-3.5 border border-slate-700">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Subject / Title</p>
                <p className="text-xs font-bold text-white mt-1">{selectedMessage.subject || 'No Subject'}</p>
              </div>

              <div className="bg-slate-800/50 p-4 border border-slate-700/80 max-h-48 overflow-y-auto">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Message Body</p>
                <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">{selectedMessage.message}</p>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedMessage(null)}
                className="w-full bg-blue-600 text-white font-bold text-xs uppercase tracking-wider py-2.5 hover:bg-blue-500 transition-colors shadow-md rounded-none"
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ============================================================
// MODERN COMPARISON CARD
// ============================================================
function ModernComparisonCard({
  title,
  icon: Icon,
  iconColor,
  accent,
  weekData,
  monthData,
  weekLabel = 'This Week',
  monthLabel = 'This Month',
  color1,
  color2,
  label1 = 'Current',
  label2 = 'Previous',
}: {
  title: string;
  icon: any;
  iconColor: string;
  accent: string;
  weekData: ComparisonSeries;
  monthData: ComparisonSeries;
  weekLabel?: string;
  monthLabel?: string;
  color1: string;
  color2: string;
  label1?: string;
  label2?: string;
}) {
  const [viewMode, setViewMode] = useState<ViewMode>('week');

  const currentData = normalizeSeries(viewMode === 'week' ? weekData.current : monthData.current, false);
  const previousData = normalizeSeries(viewMode === 'week' ? weekData.previous : monthData.previous, false);

  const chartData = currentData.map((item, index) => {
    const prevItem = previousData[index] ?? { date: item.date, views: 0 };
    return {
      date: item.date,
      [label1]: Number(item.views ?? 0),
      [label2]: Number(prevItem.views ?? 0),
    };
  });

  const totalCurrent = currentData.reduce((sum, item) => sum + Number(item.views ?? 0), 0);
  const totalPrevious = previousData.reduce((sum, item) => sum + Number(item.views ?? 0), 0);

  return (
    <section
      className="relative rounded-none border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 transition-all hover:border-slate-300"
      style={{ borderTop: `3px solid ${accent}` }}
    >
      <div className="relative z-10">
        <div className="mb-5 flex flex-col gap-3 border-b border-slate-100 pb-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-50 dark:bg-slate-800/50 rounded-none border border-slate-200 dark:border-slate-700">
              <Icon size={18} className={iconColor} />
            </div>
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">{title}</h3>
              <p className="text-[11px] font-semibold text-slate-400">Comparative trend analysis & performance</p>
            </div>
          </div>

          <div className="inline-flex rounded-none border border-slate-200 bg-slate-100 p-0.5 dark:border-slate-700 dark:bg-slate-800">
            <button
              type="button"
              className={`rounded-none px-3 py-1 text-[11px] font-bold uppercase tracking-wider transition-all ${
                viewMode === 'week'
                  ? 'bg-slate-900 text-white dark:bg-amber-500 dark:text-slate-950 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
              }`}
              onClick={() => setViewMode('week')}
            >
              {weekLabel}
            </button>
            <button
              type="button"
              className={`rounded-none px-3 py-1 text-[11px] font-bold uppercase tracking-wider transition-all ${
                viewMode === 'month'
                  ? 'bg-slate-900 text-white dark:bg-amber-500 dark:text-slate-950 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
              }`}
              onClick={() => setViewMode('month')}
            >
              {monthLabel}
            </button>
          </div>
        </div>

        <div className="h-60 w-full rounded-none border border-slate-100 bg-slate-50/40 p-2 dark:border-slate-800 dark:bg-slate-950/40 relative z-20">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -18, bottom: 0 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.3} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(value) => {
                  const date = new Date(value);
                  if (Number.isNaN(date.getTime())) return String(value);
                  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                }}
              />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={42} />
              <Tooltip
                content={<ChartTooltip accent={accent} />}
                cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                wrapperStyle={{ zIndex: 9999, outline: 'none' }}
              />
              <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} iconType="square" />
              <Bar
                dataKey={label1}
                fill={color1}
                radius={[4, 4, 0, 0]}
                isAnimationActive={true}
                animationDuration={1200}
              />
              <Bar
                dataKey={label2}
                fill={color2}
                radius={[4, 4, 0, 0]}
                isAnimationActive={true}
                animationDuration={1200}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
          <div className="rounded-none border border-slate-200 bg-slate-50 p-3.5 dark:border-slate-700 dark:bg-slate-800/50">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
              Total {label1}
            </p>
            <p className="mt-1 text-base font-black text-slate-900 dark:text-white">{totalCurrent.toLocaleString()}</p>
          </div>
          <div className="rounded-none border border-slate-200 bg-slate-50 p-3.5 dark:border-slate-700 dark:bg-slate-800/50">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
              Total {label2}
            </p>
            <p className="mt-1 text-base font-black text-slate-400 dark:text-slate-500">{totalPrevious.toLocaleString()}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

// ============================================================
// ANALYTICS FILTER POPUP
// ============================================================
function AnalyticsFilterPopup({
  isOpen,
  onClose,
  onApply,
  currentFilter,
}: {
  isOpen: boolean;
  onClose: () => void;
  onApply: (filter: string) => void;
  currentFilter: string;
}) {
  const [selectedFilter, setSelectedFilter] = useState(currentFilter);

  useEffect(() => {
    setSelectedFilter(currentFilter);
  }, [currentFilter]);

  if (!isOpen) return null;

  const filterOptions = [
    { value: '7d', label: 'Last 7 Days', icon: Clock },
    { value: '14d', label: 'Last 14 Days', icon: Calendar },
    { value: '30d', label: 'Last 30 Days', icon: Calendar },
    { value: '60d', label: 'Last 60 Days', icon: Calendar },
    { value: '90d', label: 'Last 90 Days', icon: Calendar },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-none border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-200 p-5 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <Filter size={18} className="text-amber-500" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              Filter Analytics Range
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-none p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-white"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <div className="space-y-3 p-5">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Select timeframe duration for analytics metrics:
          </p>

          <div className="space-y-2">
            {filterOptions.map((option) => {
              const isSelected = selectedFilter === option.value;
              const Icon = option.icon;
              return (
                <button
                  key={option.value}
                  onClick={() => setSelectedFilter(option.value)}
                  className={`flex w-full items-center gap-3 rounded-none border px-4 py-3 transition-all ${
                    isSelected
                      ? 'border-slate-900 bg-slate-900 text-white dark:border-amber-500 dark:bg-amber-500/10 dark:text-amber-400 font-bold'
                      : 'border-slate-200 text-slate-700 hover:border-slate-400 dark:border-slate-800 dark:text-slate-300'
                  }`}
                >
                  <Icon size={16} className={isSelected ? 'text-white dark:text-amber-400' : 'text-slate-400'} />
                  <span className="text-xs uppercase tracking-wider">{option.label}</span>
                  {isSelected && <span className="ml-auto text-xs font-black">✓</span>}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-800/40">
          <button
            onClick={onClose}
            className="rounded-none px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-600 transition-colors hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onApply(selectedFilter);
              onClose();
            }}
            className="rounded-none bg-slate-900 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition-colors hover:bg-slate-800 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400 shadow-md"
          >
            Apply Range
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// LEADERBOARD HEADER
// ============================================================
function LeaderboardHeader({
  icon: Icon,
  iconColor,
  title,
  value,
  onChange,
}: {
  icon: any;
  iconColor: string;
  title: string;
  value: TopPeriod;
  onChange: (period: TopPeriod) => void;
}) {
  const periods: Array<{ key: TopPeriod; label: string }> = [
    { key: 'today', label: 'Today' },
    { key: 'week', label: 'Week' },
    { key: 'allTime', label: 'All Time' },
  ];

  return (
    <div className="mb-3.5 flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2.5 dark:border-slate-800">
      <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
        <Icon size={16} className={iconColor} />
        {title}
      </h3>
      <div className="flex gap-1 rounded-none border border-slate-200 bg-slate-100 p-1 dark:border-slate-700 dark:bg-slate-800">
        {periods.map((period) => (
          <button
            key={period.key}
            onClick={() => onChange(period.key)}
            className={`rounded-none px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider transition-all ${
              value === period.key
                ? 'bg-slate-900 text-white dark:bg-amber-500 dark:text-slate-950'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            {period.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// MAIN DASHBOARD PAGE
// ============================================================
export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [currentFilter, setCurrentFilter] = useState('7d');
  const [topArticlesFilter, setTopArticlesFilter] = useState<TopPeriod>('today');
  const [topOffersFilter, setTopOffersFilter] = useState<TopPeriod>('today');
  const [topDealsFilter, setTopDealsFilter] = useState<TopPeriod>('today');

  const fetchDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/dashboard?filter=${currentFilter}`, {
        cache: 'no-store',
        credentials: 'include',
        headers: { 'Cache-Control': 'no-cache' },
      });
      if (!res.ok) throw new Error('Failed to fetch dashboard data');
      const result = (await res.json()) as DashboardData;
      setData(result);
    } catch (err: any) {
      setError(err.message || 'Error loading dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentFilter]);

  const weekOffersCurrent = useMemo(() => data?.weeklyOffers?.slice(-7) ?? [], [data]);
  const weekOffersPrevious = useMemo(() => data?.weeklyOffers?.slice(-14, -7) ?? [], [data]);
  const monthOffersCurrent = useMemo(() => data?.weeklyOffers?.slice(-30) ?? [], [data]);
  const monthOffersPrevious = useMemo(() => data?.weeklyOffers?.slice(-60, -30) ?? [], [data]);

  const weekDealsCurrent = useMemo(() => data?.weeklyDeals?.slice(-7) ?? [], [data]);
  const weekDealsPrevious = useMemo(() => data?.weeklyDeals?.slice(-14, -7) ?? [], [data]);
  const monthDealsCurrent = useMemo(() => data?.weeklyDeals?.slice(-30) ?? [], [data]);
  const monthDealsPrevious = useMemo(() => data?.weeklyDeals?.slice(-60, -30) ?? [], [data]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
        <Loader2 className="h-9 w-9 animate-spin text-slate-800 dark:text-amber-500" />
        <p className="animate-pulse text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
          Loading Analytics & Live Metrics...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-4">
        <div className="max-w-md rounded-none border border-rose-500/20 bg-rose-500/10 p-6 text-center shadow-xl">
          <p className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">{error}</p>
          <button
            onClick={fetchDashboard}
            className="mt-4 rounded-none bg-slate-900 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition-colors hover:bg-slate-800 shadow-md"
          >
            Retry Loading
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="min-h-screen space-y-8 bg-slate-50/50 p-4 sm:p-8 dark:bg-slate-950">
      <AnalyticsFilterPopup
        isOpen={filterOpen}
        onClose={() => setFilterOpen(false)}
        onApply={setCurrentFilter}
        currentFilter={currentFilter}
      />

      {/* TOP HEADER */}
      <div className="flex flex-col gap-4 border-b border-slate-200/80 pb-6 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
          </div>
          <h1 className="mt-2 flex items-center gap-2.5 text-2xl font-black uppercase tracking-tight text-slate-900 sm:text-3xl dark:text-white">
            <Activity size={26} className="text-amber-500" />
            Analytics Overview
          </h1>
          <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">
            Real-time performance metrics, 7-day sparkline charts, and comprehensive traffic monitoring.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setFilterOpen(true)}
            className="flex items-center gap-2 rounded-none border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-800 transition-all hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 shadow-sm"
          >
            <Filter size={14} className="text-amber-500" />
            {currentFilter === '7d'
              ? 'Last 7 Days'
              : currentFilter === '14d'
                ? 'Last 14 Days'
                : currentFilter === '30d'
                  ? 'Last 30 Days'
                  : currentFilter === '60d'
                    ? 'Last 60 Days'
                    : 'Last 90 Days'}
          </button>
          <button
            onClick={fetchDashboard}
            className="flex items-center gap-2 rounded-none bg-slate-900 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition-all hover:bg-slate-800 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400 shadow-md"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh Data
          </button>
        </div>
      </div>

      {/* 8 STAT CARDS GRID */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <EnhancedStatCard
          title="Articles"
          data={data.articles}
          icon={FileText}
          color="text-indigo-500"
          href="/admin/articles"
          sparklineData={data.weeklyArticles}
          sparklineColor="#818cf8"
          tooltipIcon={Eye}
          tooltipIconColor="text-blue-400"
          tooltipLabel="views"
          badgeText="Published Content"
        />
        <EnhancedStatCard
          title="Offers"
          data={data.offers}
          icon={Gift}
          color="text-emerald-500"
          href="/admin/offers"
          sparklineData={data.weeklyOffers}
          sparklineColor="#34d399"
          tooltipIcon={Eye}
          tooltipIconColor="text-blue-400"
          tooltipLabel="views"
          badgeText="Active Offers"
        />
        <EnhancedStatCard
          title="Deals"
          data={data.deals}
          icon={Tag}
          color="text-amber-500"
          href="/admin/deals"
          sparklineData={data.weeklyDeals}
          sparklineColor="#f59e0b"
          tooltipIcon={Eye}
          tooltipIconColor="text-amber-400"
          tooltipLabel="views"
          badgeText="Promo Deals"
        />
        <EnhancedStatCard
          title="Subscribers"
          data={data.subscribers}
          icon={Mail}
          color="text-blue-500"
          href="/admin/subscriptions"
          sparklineData={data.weeklySubscribers}
          sparklineColor="#60a5fa"
          tooltipIcon={User}
          tooltipIconColor="text-blue-400"
          tooltipLabel="subscribers"
          badgeText="Mailing List"
        />
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <EnhancedStatCard
          title="Reviews"
          data={data.reviews}
          icon={Star}
          color="text-amber-500"
          href="/admin/members"
          sparklineData={data.weeklyReviews}
          sparklineColor="#fbbf24"
          tooltipIcon={Star}
          tooltipIconColor="text-amber-400"
          tooltipLabel="reviews"
          badgeText="User Feedback"
        />
        <EnhancedStatCard
          title="Comments"
          data={data.comments}
          icon={MessageCircle}
          color="text-cyan-500"
          href="/admin/members"
          sparklineData={data.weeklyComments}
          sparklineColor="#22d3ee"
          tooltipIcon={MessageSquare}
          tooltipIconColor="text-cyan-400"
          tooltipLabel="comments"
          badgeText="Engagement"
        />
        <EnhancedStatCard
          title="Testimonials"
          data={data.testimonials}
          icon={Quote}
          color="text-purple-500"
          href="/admin/members"
          sparklineData={data.weeklyTestimonials}
          sparklineColor="#a78bfa"
          tooltipIcon={Quote}
          tooltipIconColor="text-purple-400"
          tooltipLabel="testimonials"
          badgeText="Social Proof"
        />
        <EnhancedStatCard
          title="Contacts"
          data={data.contacts}
          icon={MessageSquare}
          color="text-teal-500"
          href="/admin/contacts"
          sparklineData={data.weeklyContacts}
          sparklineColor="#2dd4bf"
          tooltipIcon={Mail}
          tooltipIconColor="text-teal-400"
          tooltipLabel="messages"
          badgeText="Inquiries"
        />
      </div>

      {/* PERFECT MAIN GRID LAYOUT */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* LEFT COLUMN (OFFERS & DEALS CHARTS) */}
        <div className="space-y-6 xl:col-span-2">
          <ModernAreaChartCard
            title="Offers Performance & Engagement"
            icon={Gift}
            iconColor="text-emerald-500"
            accent="#10b981"
            data={data.weeklyOffers}
            dataKey1="views"
            dataKey2="clicks"
            color1={palette.views}
            color2={palette.clicks}
            label1="Views"
            label2="Clicks"
            showClicks
            chartHeight="h-76"
          />

          <ModernAreaChartCard
            title="Deals Traffic & Click Rates"
            icon={Tag}
            iconColor="text-amber-500"
            accent="#0f2ac3"
            data={data.weeklyDeals}
            dataKey1="views"
            dataKey2="clicks"
            color1="#050da3"
            color2="#fc9700"
            label1="Views"
            label2="Clicks"
            showClicks
            chartHeight="h-75"
          />
        </div>

        {/* RIGHT COLUMN (CONTENT DISTRIBUTION & RECENT MESSAGES) */}
        <div className="space-y-6 xl:col-span-1">
          <DistributionCard articles={data.articles} offers={data.offers} deals={data.deals} />
          <ContactMessagesCard messages={data.contactMessages} />
        </div>
      </div>

      {/* ARTICLES CHART — FULL WIDTH WITH EXPLICIT h-64 */}
      <ModernAreaChartCard
        title="Articles Traffic Overview"
        icon={FileText}
        iconColor="text-indigo-500"
        accent="#6366f1"
        data={data.weeklyArticles}
        dataKey1="views"
        color1={palette.articles}
        label1="Views"
        showClicks={false}
        chartHeight="h-64"
      />

      {/* LEADERBOARDS SECTION */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-3">
          <LeaderboardHeader
            icon={FileText}
            iconColor="text-indigo-500"
            title="Top Articles"
            value={topArticlesFilter}
            onChange={setTopArticlesFilter}
          />
          <TopContentCard items={data.topArticles?.[topArticlesFilter] ?? []} type="article" />
        </div>
        <div className="space-y-3">
          <LeaderboardHeader
            icon={Gift}
            iconColor="text-emerald-500"
            title="Top Offers"
            value={topOffersFilter}
            onChange={setTopOffersFilter}
          />
          <TopContentCard items={data.topOffers?.[topOffersFilter] ?? []} type="offer" />
        </div>
        <div className="space-y-3">
          <LeaderboardHeader
            icon={Tag}
            iconColor="text-amber-500"
            title="Top Deals"
            value={topDealsFilter}
            onChange={setTopDealsFilter}
          />
          <TopContentCard items={data.topDeals?.[topDealsFilter] ?? []} type="deal" />
        </div>
      </div>

      {/* TREND COMPARISONS SECTION */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <ModernComparisonCard
          title="Offers Trend Comparison"
          icon={Gift}
          iconColor="text-emerald-500"
          accent="#10b981"
          weekData={{ current: weekOffersCurrent, previous: weekOffersPrevious }}
          monthData={{ current: monthOffersCurrent, previous: monthOffersPrevious }}
          weekLabel="This Week"
          monthLabel="This Month"
          color1="#10b981"
          color2="#94a3b8"
          label1="Current"
          label2="Previous"
        />
        <ModernComparisonCard
          title="Deals Trend Comparison"
          icon={Tag}
          iconColor="text-amber-500"
          accent="#f97316"
          weekData={{ current: weekDealsCurrent, previous: weekDealsPrevious }}
          monthData={{ current: monthDealsCurrent, previous: monthDealsPrevious }}
          weekLabel="This Week"
          monthLabel="This Month"
          color1="#f97316"
          color2="#94a3b8"
          label1="Current"
          label2="Previous"
        />
      </div>
    </div>
  );
}