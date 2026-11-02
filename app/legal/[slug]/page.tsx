import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, Shield, FileText, Scale, Lock, AlertCircle, ArrowLeft } from 'lucide-react';
import { getLegalPageBySlug, getAllLegalPageSlugs } from '@/lib/queries';
import { formatDate } from '@/lib/utils';
import ScrollToTop from './ScrollToTop';

export const revalidate = 86400;

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const pages = await getAllLegalPageSlugs();
  return pages.map((p) => ({ slug: p.slug }));
}

const getLegalIcon = (slug: string) => {
  const icons: Record<string, any> = {
    'privacy-policy': Lock,
    'terms-of-service': FileText,
    'disclaimer': AlertCircle,
    'cookie-policy': Shield,
  };
  return icons[slug] || Scale;
};

const getLegalLabel = (slug: string): string => {
  return slug.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
};

export default async function LegalPage({ params }: PageProps) {
  const { slug } = await params;
  const page = await getLegalPageBySlug(slug);
  if (!page) notFound();

  const allPages = await getAllLegalPageSlugs();
  const Icon = getLegalIcon(slug);

  return (
    <div className="bg-white min-h-screen selection:bg-yellow/30 selection:text-navy">
      {/* BREADCRUMB */}
      <div className="bg-light-gray border-b border-border-gray py-3.5 sm:py-4">
        <div className="w-full px-4 sm:px-6 lg:px-10">
          <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-gray-text font-medium">
            <Link href="/" className="hover:text-navy transition-colors">Home</Link>
            <ChevronRight size={14} className="text-gray-text/40" />
            <Link href="/legal" className="hover:text-navy transition-colors">Legal</Link>
            <ChevronRight size={14} className="text-gray-text/40" />
            <span className="text-navy font-bold line-clamp-1 max-w-[180px] sm:max-w-xs">{page.title}</span>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="py-8 sm:py-12 bg-light-gray/30 w-full">
        <div className="w-full px-4 sm:px-6 lg:px-10">
          
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">
            
            {/* SIDEBAR NAVIGATION - Modern Sticky Panel */}
            <div className="w-full lg:w-[280px] xl:w-[320px] shrink-0 lg:sticky lg:top-24 self-start transition-all">
              <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-gray-text hover:text-navy transition-colors mb-4 lg:hidden">
                <ArrowLeft size={16} />
                Back to Home
              </Link>

              <div className="bg-white border border-border-gray shadow-sm overflow-hidden rounded-none">
                <div className="border-b border-border-gray/60 px-5 py-4 bg-light-gray/50">
                  <h3 className="font-extrabold text-navy text-xs sm:text-sm uppercase tracking-wider flex items-center gap-2.5">
                    <Scale size={18} className="text-yellow shrink-0" />
                    <span>Legal Information</span>
                  </h3>
                </div>
                <nav className="p-2 space-y-1">
                  {allPages.map((p) => {
                    const isActive = p.slug === slug;
                    const ItemIcon = getLegalIcon(p.slug);
                    return (
                      <Link
                        key={p.slug}
                        href={`/legal/${p.slug}`}
                        className={`flex items-center justify-between gap-3 px-3.5 py-3 text-sm font-medium transition-all duration-200 ${
                          isActive 
                            ? 'bg-navy text-white shadow-sm font-semibold' 
                            : 'text-gray-text hover:bg-light-gray hover:text-navy'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <ItemIcon size={16} className={`shrink-0 transition-colors ${isActive ? 'text-yellow' : 'text-gray-text/50'}`} />
                          <span className="leading-snug truncate">{getLegalLabel(p.slug)}</span>
                        </div>
                        {isActive && (
                          <span className="text-[9px] font-black uppercase tracking-wider text-yellow bg-yellow/20 px-1.5 py-0.5 border border-yellow/20 shrink-0">
                            Active
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </nav>
              </div>
            </div>

            {/* UNIFIED CONTENT CARD — Title and body together in one sleek, professional container */}
            <div className="flex-1 min-w-0 w-full bg-white shadow-sm border border-border-gray/80 rounded-none overflow-hidden">
              
              {/* Header Section */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-6 sm:p-10 border-b border-border-gray/60 bg-light-gray/20">
                <div className="w-12 h-12 bg-yellow/20 text-navy flex items-center justify-center border border-yellow/30 shrink-0 shadow-xs">
                  <Icon size={24} />
                </div>
                <div className="min-w-0 flex-1">
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-navy tracking-tight leading-tight">
                    {page.title}
                  </h1>
                  <p className="text-xs sm:text-sm text-gray-text mt-2 flex flex-wrap items-center gap-2">
                    <span>Last updated: {formatDate(page.updated_at)}</span>
                    <span className="w-1 h-1 bg-gray-text/30 rounded-full hidden sm:inline" />
                    <span className="text-emerald-600 font-semibold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                      Current Version
                    </span>
                  </p>
                </div>
              </div>

              {/* Document Body */}
              <div className="p-6 sm:p-10 lg:p-12">
                <div className="legal-doc max-w-none" dangerouslySetInnerHTML={{ __html: page.content }} />
                
                <div className="mt-12 text-center pt-8 border-t border-border-gray/60">
                  <ScrollToTop />
                </div>
              </div>

            </div>

          </div>
        </div>
      </div>
    </div>
  );
}