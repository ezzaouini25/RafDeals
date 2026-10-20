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

// ============================================================
// GET ICON FOR LEGAL PAGE
// ============================================================

const getLegalIcon = (slug: string) => {
  const icons: Record<string, any> = {
    'privacy-policy': Lock,
    'terms-of-service': FileText,
    'disclaimer': AlertCircle,
    'cookie-policy': Shield,
  };
  return icons[slug] || Scale;
};

// ============================================================
// GET LABEL FOR LEGAL PAGE
// ============================================================

const getLegalLabel = (slug: string): string => {
  return slug
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (l) => l.toUpperCase());
};

// ============================================================
// MAIN LEGAL PAGE
// ============================================================

export default async function LegalPage({ params }: PageProps) {
  const { slug } = await params;
  const page = await getLegalPageBySlug(slug);
  if (!page) notFound();

  const allPages = await getAllLegalPageSlugs();

  // Get icon for current page
  const Icon = getLegalIcon(slug);

  return (
    <div className="bg-white min-h-screen">
      
      {/* ============================================================
          BREADCRUMB
          ============================================================ */}
      <div className="bg-light-gray border-b border-border-gray py-3 sm:py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-gray-text">
            <Link href="/" className="hover:text-navy transition-colors font-medium">Home</Link>
            <ChevronRight size={14} className="text-gray-text/40" />
            <Link href="/legal" className="hover:text-navy transition-colors font-medium">Legal</Link>
            <ChevronRight size={14} className="text-gray-text/40" />
            <span className="text-navy font-bold line-clamp-1 max-w-[150px] sm:max-w-xs">{page.title}</span>
          </div>
        </div>
      </div>

      {/* ============================================================
          MAIN CONTENT
          ============================================================ */}
      <div className="py-6 sm:py-10 md:py-12 bg-light-gray/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 lg:gap-10">
            
            {/* ============================================================
                SIDEBAR
                ============================================================ */}
            <div className="lg:col-span-3">
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-sm font-medium text-gray-text hover:text-navy transition-colors mb-4 lg:hidden"
              >
                <ArrowLeft size={16} />
                Back to Home
              </Link>

              <div className="sticky top-24 bg-white border border-border-gray shadow-sm overflow-hidden">
                <div className="border-b border-border-gray/50 px-4 sm:px-5 py-3 sm:py-4">
                  <h3 className="font-bold text-navy text-xs sm:text-sm uppercase tracking-wider flex items-center gap-2">
                    <Scale size={16} className="text-yellow shrink-0" />
                    <span>Legal Information</span>
                  </h3>
                </div>
                <nav className="p-2 space-y-0.5 max-h-[400px] overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-track]:bg-transparent">
                  {allPages.map((p) => {
                    const isActive = p.slug === slug;
                    const ItemIcon = getLegalIcon(p.slug);
                    return (
                      <Link
                        key={p.slug}
                        href={`/legal/${p.slug}`}
                        className={`flex items-center gap-2.5 px-3 py-2.5 sm:py-3 text-xs sm:text-sm font-medium transition-all duration-200 ${
                          isActive
                            ? 'bg-navy text-white shadow-sm'
                            : 'text-gray-text hover:bg-light-gray hover:text-navy'
                        }`}
                      >
                        <ItemIcon size={16} className={`shrink-0 ${isActive ? 'text-yellow' : 'text-gray-text/40'}`} />
                        <span className="truncate">{getLegalLabel(p.slug)}</span>
                        {isActive && (
                          <span className="ml-auto text-[8px] sm:text-[9px] font-black uppercase tracking-wider text-yellow bg-yellow/20 px-1.5 py-0.5 border border-yellow/20 shrink-0">
                            Active
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </nav>
              </div>
            </div>

            {/* ============================================================
                CONTENT
                ============================================================ */}
            <div className="lg:col-span-9">
              <div className="bg-white border border-border-gray/50 shadow-sm overflow-hidden">
                
                {/* Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 p-5 sm:p-6 md:p-8 pb-4 sm:pb-5 border-b border-border-gray/50">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-yellow/20 text-navy flex items-center justify-center border border-yellow/30 shrink-0">
                    <Icon size={20} className="sm:w-6 sm:h-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black text-navy tracking-tight leading-tight">
                      {page.title}
                    </h1>
                    <p className="text-xs sm:text-sm text-gray-text mt-1 flex flex-wrap items-center gap-2">
                      <span>Last updated: {formatDate(page.updated_at)}</span>
                      <span className="w-1 h-1 bg-gray-text/30 rounded-full hidden sm:inline" />
                      <span className="text-emerald-600 font-medium text-xs sm:text-sm">✓ Current</span>
                    </p>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 sm:p-6 md:p-8 lg:p-10">
                  <div
                    className="legal-content prose prose-sm sm:prose-base md:prose-lg max-w-none
                      prose-headings:text-navy prose-headings:font-black prose-headings:tracking-tight
                      prose-h1:text-xl sm:prose-h1:text-2xl md:prose-h1:text-3xl lg:prose-h1:text-4xl prose-h1:mb-6 prose-h1:border-b prose-h1:border-border-gray/30 prose-h1:pb-4
                      prose-h2:text-lg sm:prose-h2:text-xl md:prose-h2:text-2xl lg:prose-h2:text-3xl prose-h2:mt-8 prose-h2:mb-4 prose-h2:flex prose-h2:items-center prose-h2:gap-3 prose-h2:before:content-[''] prose-h2:before:w-2 prose-h2:before:h-6 sm:prose-h2:before:h-8 prose-h2:before:bg-yellow
                      prose-h3:text-base sm:prose-h3:text-lg md:prose-h3:text-xl prose-h3:font-bold prose-h3:mt-6 prose-h3:mb-3 prose-h3:border-l-4 prose-h3:border-yellow prose-h3:pl-4
                      prose-h4:text-sm sm:prose-h4:text-base md:prose-h4:text-lg prose-h4:font-bold prose-h4:mt-4 prose-h4:mb-2
                      prose-p:text-gray-text prose-p:leading-relaxed prose-p:mb-4
                      prose-strong:text-navy prose-strong:font-bold
                      prose-a:text-navy prose-a:font-bold prose-a:underline prose-a:decoration-yellow/50 prose-a:hover:decoration-yellow prose-a:transition-colors
                      prose-ul:list-none prose-ul:pl-0 prose-ul:space-y-2 prose-ul:mb-6
                      prose-li:relative prose-li:pl-6 prose-li:text-gray-text prose-li:leading-relaxed prose-li:before:content-['✓'] prose-li:before:absolute prose-li:before:left-0 prose-li:before:text-yellow prose-li:before:font-bold
                      prose-ol:list-decimal prose-ol:pl-5 prose-ol:space-y-2 prose-ol:mb-6
                      prose-ol-li:text-gray-text prose-ol-li:leading-relaxed prose-ol-li:font-semibold prose-ol-li:marker:text-navy prose-ol-li:marker:font-black
                      prose-blockquote:border-l-4 prose-blockquote:border-yellow prose-blockquote:bg-light-gray/40 prose-blockquote:pl-4 prose-blockquote:py-3 prose-blockquote:my-6 prose-blockquote:not-italic prose-blockquote:text-navy/80 prose-blockquote:font-medium prose-blockquote:border-r prose-blockquote:border-yellow/20
                      prose-blockquote-p:mb-0
                      prose-table:w-full prose-table:my-6 sm:prose-table:my-8 prose-table:border-collapse prose-table:border prose-table:border-border-gray/70 prose-table:shadow-sm prose-table:overflow-x-auto prose-table:block prose-table:whitespace-nowrap sm:prose-table:whitespace-normal
                      prose-thead:bg-navy prose-thead:text-white
                      prose-th:px-3 sm:prose-th:px-4 prose-th:py-2 sm:prose-th:py-3 prose-th:text-left prose-th:text-[10px] sm:prose-th:text-xs prose-th:font-black prose-th:uppercase prose-th:tracking-wider
                      prose-tr:border-b prose-tr:border-border-gray/30 prose-tr:last:border-0 prose-tr:hover:bg-light-gray/20 prose-tr:transition-colors
                      prose-tr:nth-child(even):bg-light-gray/30
                      prose-td:px-3 sm:prose-td:px-4 prose-td:py-2 sm:prose-td:py-3 prose-td:text-xs sm:prose-td:text-sm prose-td:text-gray-text prose-td:font-medium
                      prose-code:bg-light-gray prose-code:text-rose-600 prose-code:px-1.5 prose-code:py-0.5 prose-code:text-[10px] sm:prose-code:text-xs prose-code:font-mono prose-code:border prose-code:border-border-gray/40
                      prose-pre:bg-navy/95 prose-pre:text-yellow/90 prose-pre:p-4 prose-pre:overflow-x-auto prose-pre:my-6 prose-pre:shadow-lg prose-pre:border prose-pre:border-white/10
                      prose-pre-code:text-yellow-hover prose-pre-code:bg-transparent prose-pre-code:p-0 prose-pre-code:border-0
                    "
                    dangerouslySetInnerHTML={{ __html: page.content }}
                  />
                </div>

              </div>

              {/* Back to top - Client Component */}
              <div className="mt-6 text-center">
                <ScrollToTop />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}