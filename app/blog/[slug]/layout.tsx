import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { getArticleBySlug, getAllArticleSlugs } from '@/lib/queries';
import type { Article } from '@/types';

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}

const SITE_URL = 'https://rafdeals.com';
const SITE_NAME = 'RafDeals';

// ============================================================
// HELPER: Get absolute image URL
// ============================================================
function getAbsoluteImageUrl(path: string | null | undefined): string {
  if (!path) return `${SITE_URL}/img/og-default.jpg`;
  
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  
  if (path.startsWith('/')) {
    return `${SITE_URL}${path}`;
  }
  
  return `${SITE_URL}/${path}`;
}

// ============================================================
// GENERATE STATIC PARAMS
// ============================================================
export async function generateStaticParams() {
  const articles = await getAllArticleSlugs();
  return articles.map((a) => ({ slug: a.slug }));
}

// ============================================================
// GENERATE METADATA
// ============================================================
export async function generateMetadata({ params }: LayoutProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);

  if (!article) {
    return {
      title: 'Article Not Found',
      description: 'The requested guide could not be found.',
    };
  }

  const title = article.meta_title || `${article.title} | ${SITE_NAME}`;
  const description = article.meta_description || article.description || `Read our comprehensive guide on ${article.title}. Learn expert strategies for verified online offers and exclusive deals.`;
  const keywords = article.meta_keywords || 'online offers guides, exclusive deals tips, verified offers articles, strategies';

  const coverImage = getAbsoluteImageUrl(article.cover_image);

  return {
    title,
    description,
    keywords: keywords.split(',').map(k => k.trim()),
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/blog/${article.slug}`,
      siteName: SITE_NAME,
      type: 'article',
      publishedTime: article.created_at,
      modifiedTime: article.updated_at || article.created_at,
      authors: article.author_name ? [article.author_name] : undefined,
      images: [
        {
          url: coverImage,
          width: 1254,
          height: 1254,
          alt: article.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [coverImage],
      creator: '@rafdeals',
      site: '@rafdeals',
    },
    alternates: {
      canonical: `${SITE_URL}/blog/${article.slug}`,
    },
  };
}

// ============================================================
// JSON-LD STRUCTURED DATA
// ============================================================
function ArticleJsonLd({ article }: { article: Article }) {
  const authorName = article.author_name || `${SITE_NAME} Team`;
  const authorPicture = article.author_picture || null;
  const categoryName = article.category?.name || null;
  const categorySlug = article.category?.slug || null;
  
  const coverImage = getAbsoluteImageUrl(article.cover_image);

  const author = authorPicture ? {
    '@type': 'Person',
    name: authorName,
    image: authorPicture,
  } : {
    '@type': 'Organization',
    name: authorName,
  };

  const category = categoryName ? {
    '@type': 'Thing',
    name: categoryName,
  } : undefined;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': `${SITE_URL}/blog/${article.slug}#webpage`,
        url: `${SITE_URL}/blog/${article.slug}`,
        name: article.meta_title || article.title,
        description: article.meta_description || article.description,
        isPartOf: {
          '@id': `${SITE_URL}#website`,
        },
        breadcrumb: {
          '@id': `${SITE_URL}/blog/${article.slug}#breadcrumb`,
        },
        primaryImageOfPage: {
          '@type': 'ImageObject',
          url: coverImage,
          width: 1254,
          height: 1254,
        },
        about: category,
        datePublished: article.created_at,
        dateModified: article.updated_at || article.created_at,
        author: author,
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${SITE_URL}/blog/${article.slug}#breadcrumb`,
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: SITE_URL,
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'Blog',
            item: `${SITE_URL}/blog`,
          },
          ...(categoryName ? [{
            '@type': 'ListItem',
            position: 3,
            name: categoryName,
            item: `${SITE_URL}/blog/category/${categorySlug || ''}`,
          }] : []),
          {
            '@type': 'ListItem',
            position: categoryName ? 4 : 3,
            name: article.title,
            item: `${SITE_URL}/blog/${article.slug}`,
          },
        ],
      },
      {
        '@type': 'Article',
        '@id': `${SITE_URL}/blog/${article.slug}#article`,
        headline: article.meta_title || article.title,
        description: article.meta_description || article.description,
        image: coverImage,
        datePublished: article.created_at,
        dateModified: article.updated_at || article.created_at,
        author: author,
        publisher: {
          '@type': 'Organization',
          name: SITE_NAME,
          logo: {
            '@type': 'ImageObject',
            url: `${SITE_URL}/img/logo.png`,
          },
        },
        mainEntityOfPage: {
          '@type': 'WebPage',
          '@id': `${SITE_URL}/blog/${article.slug}#webpage`,
        },
        ...(category && { about: category }),
        ...(article.read_time && { 
          timeRequired: `PT${article.read_time}M`,
        }),
      },
    ],
  };

  const escapedJsonLd = JSON.stringify(jsonLd).replace(/</g, '\\u003c');

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: escapedJsonLd }}
    />
  );
}

// ============================================================
// LAYOUT COMPONENT
// ============================================================
export default async function BlogDetailLayout({ children, params }: LayoutProps) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);

  if (!article) notFound();

  return (
    <>
      <ArticleJsonLd article={article} />
      {children}
    </>
  );
}

// ============================================================
// REVALIDATE
// ============================================================
export const revalidate = 3600;