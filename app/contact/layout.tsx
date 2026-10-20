import type { Metadata } from 'next';

const SITE_URL = 'https://rafdeals.com';
const SITE_NAME = 'RafDeals';

export const metadata: Metadata = {
  title: 'Contact Us',
  description: 'Get in touch with the RafDeals team. Reach out for support, questions regarding verified offers, or business partnerships.',
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    title: `Contact Us | ${SITE_NAME}`,
    description: 'Get in touch with the RafDeals team for support or partnership inquiries.',
    url: `${SITE_URL}/contact`,
    siteName: SITE_NAME,
    type: 'website',
    images: [
      {
        url: `${SITE_URL}/img/og-default.jpg`,
        width: 1254,
        height: 1254,
        alt: `Contact ${SITE_NAME}`,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `Contact Us | ${SITE_NAME}`,
    description: 'Get in touch with the RafDeals team for support or partnerships.',
    images: [`${SITE_URL}/img/og-default.jpg`],
    creator: '@rafdeals',
    site: '@rafdeals',
  },
  alternates: {
    canonical: `${SITE_URL}/contact`,
  },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  const contactSchema = {
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    name: `Contact ${SITE_NAME}`,
    description: 'Get in touch with the RafDeals team for support, questions, or partnerships.',
    url: `${SITE_URL}/contact`,
  };

  const escapedJsonLd = JSON.stringify(contactSchema).replace(/</g, '\\u003c');

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: escapedJsonLd }}
      />
      <div className="contact-section-wrapper min-h-[70vh] bg-gray-50 py-10 px-4 sm:px-6 lg:px-8" id="contact-section-wrapper">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </div>
    </>
  );
}